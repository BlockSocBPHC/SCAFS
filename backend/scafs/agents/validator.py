import logging
from scafs.state import SharedState, VerificationRecord
from scafs.agents.auditor import AuditorAgent

logger = logging.getLogger(__name__)

# ==========================================
# VALIDATOR SUB-AGENTS
# ==========================================

class ReAuditTrigger:
    """4.4.1 Sub-Agent: Re-Audit Trigger"""
    def __init__(self, auditor: AuditorAgent):
        self.auditor = auditor

    def execute(self, state: SharedState):
        logger.info("-> Triggering Auditor Agent on updated source...")
        # Calls the full Auditor Agent (all sub-agents) on the post-fix contract
        self.auditor.run(state)

class DiffComparator:
    """4.4.2 Sub-Agent: Diff Comparator"""
    def execute(self, state: SharedState) -> VerificationRecord:
        if len(state.audit_reports) < 2:
            logger.error("Validator requires at least 2 audit reports to diff.")
            return VerificationRecord()
            
        old_report = state.audit_reports[-2]
        new_report = state.audit_reports[-1]
        
        verification = VerificationRecord()
        
        old_ids = {f.finding_id: f for f in old_report.findings}
        new_ids = {f.finding_id: f for f in new_report.findings}
        
        # Match RESOLVED and UNRESOLVED
        for old_id, old_finding in old_ids.items():
            if old_id not in new_ids:
                logger.info(f"Finding {old_id} successfully RESOLVED.")
                verification.findings_resolved.append(old_id)
            else:
                logger.warning(f"Finding {old_id} is UNRESOLVED.")
                verification.findings_unresolved.append(old_id)
                    
        # Match REGRESSED (New findings)
        for new_id, new_finding in new_ids.items():
            if new_id not in old_ids:
                logger.error(f"REGRESSION DETECTED: New finding introduced -> {new_id}")
                verification.findings_regressed.append(new_id)
                verification.new_findings_introduced.append(new_finding)
                
        verification.final_compilation_status = "PASS"
        return verification

class IterationCounter:
    """4.4.3 Sub-Agent: Iteration Counter"""
    def execute(self, state: SharedState, verification: VerificationRecord):
        state.verification = verification
        
        unresolved_count = len(verification.findings_unresolved)
        regressed_count = len(verification.findings_regressed)
        
        logger.info(f"Verification complete: {len(verification.findings_resolved)} resolved, {unresolved_count} unresolved, {regressed_count} regressions.")
        
        if unresolved_count == 0 and regressed_count == 0:
            logger.info("-> Decision: ALL RESOLVED (Terminate)")
        elif state.iteration >= state.max_iterations:
            logger.info(f"-> Decision: TERMINATE (Max iterations {state.max_iterations} reached)")
        else:
            logger.info("-> Decision: CONTINUE (Returning to Fixer)")


# ==========================================
# MAIN VALIDATOR AGENT (Orchestrator)
# ==========================================

class ValidatorAgent:
    def __init__(self):
        self.re_audit_trigger = ReAuditTrigger(AuditorAgent())
        self.diff_comparator = DiffComparator()
        self.iteration_counter = IterationCounter()

    def run(self, state: SharedState):
        logger.info("ValidatorAgent: Beginning Verification Cycle...")
        
        # 1. Re-Audit
        self.re_audit_trigger.execute(state)
        
        # 2. Diff
        verification = self.diff_comparator.execute(state)
        
        # 3. Iteration Logic
        self.iteration_counter.execute(state, verification)
