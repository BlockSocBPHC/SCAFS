import argparse
import logging
import sys
from pathlib import Path

from scafs.supervisor import Supervisor

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - [%(name)s] %(message)s')
logger = logging.getLogger("scafs-cli")

def main():
    parser = argparse.ArgumentParser(description="SCAFS: Smart Contract Auditor & Fixer System")
    parser.add_argument("source", help="Path to the Solidity file (.sol) to audit and fix.")
    
    args = parser.parse_args()
    source_path = Path(args.source)
    
    if not source_path.exists():
        logger.error(f"Error: File not found at {source_path}")
        sys.exit(1)
        
    logger.info(f"Initializing SCAFS for {source_path.name}...")
    
    supervisor = Supervisor(source_path=str(source_path))
    final_state = supervisor.run()
    
    logger.info("==================================================")
    logger.info("SCAFS Pipeline Complete!")
    logger.info(f"Fixed Contract: {final_state.output_artifacts.get('fixed_contract')}")
    logger.info(f"Full JSON Report: {final_state.output_artifacts.get('audit_report_json')}")
    logger.info("==================================================")

if __name__ == "__main__":
    main()
