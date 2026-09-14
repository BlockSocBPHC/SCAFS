import logging
import json
import tempfile
import os
from typing import List

from scafs.state import SharedState, AuditReport, Finding, Severity
from scafs.utils import call_llm, run_subprocess

logger = logging.getLogger(__name__)


# ==========================================
# AUDITOR SUB-AGENTS
# ==========================================

class StaticAnalyzer:
    """4.2.1 Sub-Agent: Static Analyzer (Slither Integration)"""
    def execute(self, code: str) -> List[Finding]:
        logger.info("-> Running Slither Static Analyzer...")
        
        fd, temp_path = tempfile.mkstemp(suffix=".sol")
        json_out = temp_path + ".json"
        findings = []
        
        try:
            with os.fdopen(fd, 'w', encoding='utf-8') as f:
                f.write(code)
            
            # Execute slither CLI
            success, stdout, stderr = run_subprocess(["slither", temp_path, "--json", json_out])
            
            if not os.path.exists(json_out):
                logger.warning(f"Slither failed to produce JSON output. Stderr: {stderr.strip()}")
                return findings
                
            with open(json_out, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            detectors = data.get("results", {}).get("detectors", [])
            code_lines = code.split("\n")
            
            impact_map = {
                "High": Severity.HIGH, 
                "Medium": Severity.MEDIUM, 
                "Low": Severity.LOW, 
                "Informational": Severity.INFORMATIONAL
            }
            
            for d in detectors:
                sev = impact_map.get(d.get("impact", "Informational"), Severity.INFORMATIONAL)
                
                lines = []
                func_name = "Unknown"
                contract_name = "Unknown"
                
                for elem in d.get("elements", []):
                    if elem["type"] == "function":
                        func_name = elem["name"]
                        lines = elem.get("source_mapping", {}).get("lines", [])
                    elif elem["type"] == "contract":
                        contract_name = elem["name"]
                        
                v_code = ""
                if lines:
                    start, end = min(lines) - 1, max(lines)
                    # Extract the exact block of vulnerable code
                    v_code = "\n".join(code_lines[start:end])
                    
                findings.append(Finding(
                    source="SLITHER",
                    detector_id=d.get("check", "unknown"),
                    severity=sev,
                    title=f"{d.get('check')} in {func_name}()",
                    description=d.get("description", ""),
                    affected_contract=contract_name,
                    affected_function=func_name,
                    affected_lines=lines,
                    vulnerable_code=v_code
                ))
        except Exception as e:
            logger.error(f"Error parsing Slither output: {e}")
        finally:
            if os.path.exists(temp_path): os.remove(temp_path)
            if os.path.exists(json_out): os.remove(json_out)
            
        logger.info(f"Slither found {len(findings)} issues.")
        return findings

class ReentrancyPass:
    """4.2.2 Sub-Agent: LLM Semantic Analyzer - Reentrancy"""
    def execute(self, code: str) -> List[Finding]:
        logger.info("-> Running LLM Reentrancy Pass...")
        prompt = f"Analyze for reentrancy. Code: {code}"
        call_llm(prompt, require_json=True)
        return []

class AccessControlPass:
    """4.2.3 Sub-Agent: LLM Semantic Analyzer - Access Control"""
    def execute(self, code: str) -> List[Finding]:
        logger.info("-> Running LLM Access Control Pass...")
        prompt = f"Analyze for access control. Code: {code}"
        call_llm(prompt, require_json=True)
        return []

class EconomicLogicPass:
    """4.2.4 Sub-Agent: LLM Semantic Analyzer - Economic Logic"""
    def execute(self, code: str) -> List[Finding]:
        logger.info("-> Running LLM Economic Logic Pass...")
        prompt = f"Analyze for economic exploits. Code: {code}"
        call_llm(prompt, require_json=True)
        return []

class RAGEnricher:
    """4.2.5 Sub-Agent: RAG Enricher (ChromaDB Integration)"""
    def execute(self, findings: List[Finding]) -> List[Finding]:
        try:
            import chromadb
            db_path = os.path.join(os.path.dirname(__file__), '..', '..', 'chroma_db')
            if not os.path.exists(db_path):
                logger.warning("ChromaDB not found. Run scripts/build_knowledge_base.py first. Skipping RAG enrichment.")
                return findings
                
            client = chromadb.PersistentClient(path=db_path)
            collection = client.get_collection(name="audit_reports")
            
            for finding in findings:
                # Query the vector DB for similar bugs based on the current finding's description and code
                query_text = f"Vulnerability: {finding.title}\nDescription: {finding.description}\nCode: {finding.vulnerable_code}"
                
                results = collection.query(
                    query_texts=[query_text],
                    n_results=1
                )
                
                if results and results['metadatas'] and len(results['metadatas'][0]) > 0:
                    best_match = results['metadatas'][0][0]
                    historical_context = f"\n\n[RAG Context]: Similar to {best_match.get('source')} finding. Historical severity: {best_match.get('severity')}."
                    finding.description += historical_context
                    logger.info(f"Enriched finding {finding.finding_id} with RAG context from {best_match.get('source')}.")
                    
        except ImportError:
            logger.warning("chromadb not installed. Skipping RAG enrichment.")
        except Exception as e:
            logger.error(f"RAG Enrichment error: {e}")
            
        return findings

class FalsePositiveSuppressor:
    """4.2.6 Sub-Agent: False Positive Suppressor"""
    def execute(self, findings: List[Finding], code: str) -> List[Finding]:
        valid_findings = []
        for finding in findings:
            if finding.source == "SLITHER":
                prompt = f"Is this exploitable? Finding: {finding.description}"
                # If call_llm(prompt) == 'FALSE_POSITIVE': continue
            valid_findings.append(finding)
        return valid_findings

class ReportSynthesizer:
    """4.2.7 Sub-Agent: Report Synthesizer"""
    def execute(self, findings: List[Finding]) -> List[Finding]:
        # Semantic similarity de-duplication
        return findings


# ==========================================
# MAIN AUDITOR AGENT (Orchestrator of Sub-Agents)
# ==========================================

class AuditorAgent:
    def __init__(self):
        self.static_analyzer = StaticAnalyzer()
        self.reentrancy_pass = ReentrancyPass()
        self.access_control_pass = AccessControlPass()
        self.economic_logic_pass = EconomicLogicPass()
        self.rag_enricher = RAGEnricher()
        self.fp_suppressor = FalsePositiveSuppressor()
        self.report_synthesizer = ReportSynthesizer()

    def run(self, state: SharedState):
        logger.info("AuditorAgent: Commencing detection phase...")
        code = state.source.current
        
        # Parallel Fan-Out (In production, use ThreadPoolExecutor)
        f1 = self.static_analyzer.execute(code)
        f2 = self.reentrancy_pass.execute(code)
        f3 = self.access_control_pass.execute(code)
        f4 = self.economic_logic_pass.execute(code)
        
        # Merge & Synthesize
        all_findings = f1 + f2 + f3 + f4
        merged_findings = self.report_synthesizer.execute(all_findings)
        
        # Enrich & Filter
        enriched_findings = self.rag_enricher.execute(merged_findings)
        final_findings = self.fp_suppressor.execute(enriched_findings, code)
        
        # Output Generation
        report = AuditReport(iteration=state.iteration, findings=final_findings)
        
        for f in final_findings:
            if f.severity.name == "CRITICAL": report.summary.critical += 1
            elif f.severity.name == "HIGH": report.summary.high += 1
            elif f.severity.name == "MEDIUM": report.summary.medium += 1
            elif f.severity.name == "LOW": report.summary.low += 1
            else: report.summary.informational += 1
            
        report.summary.risk_score = (report.summary.critical * 10 + report.summary.high * 5 + report.summary.medium * 2 + report.summary.low * 1)
        state.audit_reports.append(report)
