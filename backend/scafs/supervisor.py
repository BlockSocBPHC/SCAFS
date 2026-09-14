import hashlib
import json
import logging
from pathlib import Path
from typing import Optional

from scafs.state import SharedState, SourceCode, PipelineStatus
from scafs.agents.auditor import AuditorAgent
from scafs.agents.fixer import FixerAgent
from scafs.agents.validator import ValidatorAgent

logger = logging.getLogger(__name__)

class Supervisor:
    """
    The State Machine Hub.
    Agents never call each other directly — all routing decisions are made here.
    """
    def __init__(self, source_path: str):
        self.source_path = Path(source_path)
        if not self.source_path.exists():
            raise FileNotFoundError(f"Source file {source_path} not found.")
            
        with open(self.source_path, 'r', encoding='utf-8') as f:
            original_code = f.read()
            
        contract_hash = hashlib.sha256(original_code.encode()).hexdigest()
        
        self.state = SharedState(
            contract_hash=contract_hash,
            source=SourceCode(
                original=original_code,
                current=original_code, # Starts as original
                flattened=None # To be populated if needed
            )
        )

        # Initialize agents
        self.auditor = AuditorAgent()
        self.fixer = FixerAgent()
        self.validator = ValidatorAgent()

    def run(self) -> SharedState:
        """Main execution loop (The State Machine)"""
        logger.info(f"Starting SCAFS Pipeline: {self.state.pipeline_id}")
        
        while self.state.pipeline_status != PipelineStatus.DONE and self.state.pipeline_status != PipelineStatus.ERROR:
            
            if self.state.pipeline_status == PipelineStatus.INIT:
                logger.info("STATE: INIT -> Dispatching Auditor")
                self.state.pipeline_status = PipelineStatus.AUDITING
                
            elif self.state.pipeline_status == PipelineStatus.AUDITING:
                logger.info(f"STATE: AUDITING (Iteration {self.state.iteration})")
                self.auditor.run(self.state)
                
                # State Machine Logic:
                latest_report = self.state.audit_reports[-1] if self.state.audit_reports else None
                if not latest_report or len(latest_report.findings) == 0:
                    logger.info("No findings detected. Moving to DONE.")
                    self.state.pipeline_status = PipelineStatus.DONE
                else:
                    logger.info(f"Found {len(latest_report.findings)} issues. Dispatching Fixer.")
                    self.state.pipeline_status = PipelineStatus.FIXING
                    
            elif self.state.pipeline_status == PipelineStatus.FIXING:
                logger.info(f"STATE: FIXING (Iteration {self.state.iteration})")
                self.fixer.run(self.state)
                logger.info("Fixes applied. Dispatching Validator.")
                self.state.pipeline_status = PipelineStatus.VALIDATING
                
            elif self.state.pipeline_status == PipelineStatus.VALIDATING:
                logger.info(f"STATE: VALIDATING (Iteration {self.state.iteration})")
                self.validator.run(self.state)
                
                verif = self.state.verification
                all_resolved = verif and len(verif.findings_unresolved) == 0 and len(verif.findings_regressed) == 0
                
                if all_resolved or self.state.iteration >= self.state.max_iterations:
                    if all_resolved:
                        logger.info("All findings verified resolved. Moving to DONE.")
                    else:
                        logger.info(f"Max iterations ({self.state.max_iterations}) reached. Halting as best-effort.")
                    self.state.pipeline_status = PipelineStatus.DONE
                else:
                    logger.info("Bugs remain. Incrementing iteration and looping back to Fixer.")
                    self.state.iteration += 1
                    self.state.pipeline_status = PipelineStatus.FIXING

        self._assemble_output_artifacts()
        return self.state
        
    def _assemble_output_artifacts(self):
        """Generates the final files for the user"""
        logger.info("Assembling final outputs...")
        
        # Write fixed contract
        fixed_path = self.source_path.parent / f"{self.source_path.stem}_fixed.sol"
        with open(fixed_path, 'w', encoding='utf-8') as f:
            f.write(self.state.source.current)
            
        # Write JSON state dump for debugging/integration
        state_dump_path = self.source_path.parent / f"{self.source_path.stem}_scafs_report.json"
        with open(state_dump_path, 'w', encoding='utf-8') as f:
            f.write(self.state.model_dump_json(indent=2))
            
        self.state.output_artifacts = {
            "fixed_contract": str(fixed_path),
            "audit_report_json": str(state_dump_path)
        }
