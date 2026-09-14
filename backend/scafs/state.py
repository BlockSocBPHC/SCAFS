import datetime
import uuid
from enum import Enum
from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class Severity(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INFORMATIONAL = "INFORMATIONAL"


class Status(str, Enum):
    OPEN = "OPEN"
    RESOLVED = "RESOLVED"
    REGRESSED = "REGRESSED"
    MANUAL_REVIEW_REQUIRED = "MANUAL_REVIEW_REQUIRED"


class PipelineStatus(str, Enum):
    INIT = "INIT"
    AUDITING = "AUDITING"
    FIXING = "FIXING"
    VALIDATING = "VALIDATING"
    DONE = "DONE"
    ERROR = "ERROR"


class Finding(BaseModel):
    finding_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    source: str  # e.g., "SLITHER", "LLM", "HYBRID"
    detector_id: str
    severity: Severity
    title: str
    description: str
    affected_contract: str
    affected_function: str
    affected_lines: List[int]
    vulnerable_code: str
    fix_pattern: Optional[str] = None
    fix_recommendation: Optional[str] = None
    rag_references: List[str] = Field(default_factory=list)
    confidence: float = 1.0
    status: Status = Status.OPEN


class AuditSummary(BaseModel):
    critical: int = 0
    high: int = 0
    medium: int = 0
    low: int = 0
    informational: int = 0
    risk_score: int = 0


class AuditReport(BaseModel):
    iteration: int
    timestamp: str = Field(default_factory=lambda: datetime.datetime.now(datetime.UTC).isoformat())
    findings: List[Finding] = Field(default_factory=list)
    summary: AuditSummary = Field(default_factory=AuditSummary)


class PatchRecord(BaseModel):
    patch_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    finding_id: str
    iteration: int
    strategy: str  # "TEMPLATE" or "LLM"
    template_used: Optional[str] = None
    original_code: str
    patched_code: str
    compilation_attempts: int = 0
    compilation_status: str = "PENDING"  # "PASS" or "FAIL"
    compiler_errors: List[str] = Field(default_factory=list)
    confidence: float = 1.0


class ChangelogEntry(BaseModel):
    finding_id: str
    action: str
    strategy: str
    confidence: float
    compilation_attempts: int
    note: str


class VerificationRecord(BaseModel):
    final_compilation_status: str = "PENDING"
    findings_resolved: List[str] = Field(default_factory=list)
    findings_unresolved: List[str] = Field(default_factory=list)
    findings_regressed: List[str] = Field(default_factory=list)
    new_findings_introduced: List[Finding] = Field(default_factory=list)


class SourceCode(BaseModel):
    original: str
    flattened: Optional[str] = None
    current: str


class SharedState(BaseModel):
    """
    The single structured JSON object maintained in memory by the Supervisor.
    All agents read/write to this schema.
    """
    pipeline_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    contract_hash: str = ""
    source: SourceCode
    pipeline_status: PipelineStatus = PipelineStatus.INIT
    iteration: int = 0
    max_iterations: int = 3
    audit_reports: List[AuditReport] = Field(default_factory=list)
    patches: List[PatchRecord] = Field(default_factory=list)
    fix_changelog: List[ChangelogEntry] = Field(default_factory=list)
    verification: Optional[VerificationRecord] = None
    output_artifacts: Dict[str, str] = Field(default_factory=dict)
