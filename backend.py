from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import xml.etree.ElementTree as ET
import xmltodict
import markdown
from typing import Dict, List, Optional
from pydantic import BaseModel
import uvicorn
from fastapi.responses import StreamingResponse
from xml_to_pdf import generate_xml_pdf
from io import BytesIO, StringIO
import fastapi
from toolsmetadata import AlteryxDocGenerator  # Import AlteryxDocGenerator

app = FastAPI(title="Alteryx Workflow Analyzer",
             description="API for analyzing and documenting Alteryx workflows")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5507",
        "http://127.0.0.1:5507",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class WorkflowTool(BaseModel):
    """Model for Alteryx workflow tool information"""
    tool_id: str
    plugin: str
    description: str
    configuration: Dict
    connections: List[str] = []
    position: Dict[str, str] = {}  # Added to store x,y coordinates
    custom_properties: Dict = {}   # Added to store additional tool properties

class WorkflowAnalysis(BaseModel):
    """Model for complete workflow analysis"""
    name: str
    creator: Optional[str] = None
    created_date: Optional[str] = None
    description: Optional[str] = None
    tools: List[WorkflowTool]
    data_flow: List[Dict[str, str]]
    custom_tools: List[Dict] = []  # Added to store custom tool details
    workflow_constants: Dict = {}  # Added to store workflow constants
    yxmd_version: Optional[str] = None  # Added to store workflow version

@app.get("/test")
async def test_connection():
    """Test endpoint to verify API and core functionality"""
    try:
        # Test basic API connection
        api_status = {
            "status": "success",
            "message": "Backend server is running",
            "server_info": {
                "fastapi_version": fastapi.__version__,
                "cors_enabled": True,
                "allowed_origins": [
                    "http://localhost:5507",
                    "http://127.0.0.1:5507",
                    "http://localhost:8000",
                    "http://127.0.0.1:8000"
                ]
            }
        }
        return api_status
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@app.post("/upload")
async def upload_workflow(file: UploadFile = File(...)):
    """Upload and analyze Alteryx workflow file"""
    if not file.filename.endswith('.yxmd'):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Please upload an Alteryx workflow (.yxmd) file"
        )
    
    try:
        # Read file content
        content = await file.read()
        
        # Create instance of AlteryxDocGenerator from toolsmetadata
        doc_generator = AlteryxDocGenerator()
        
        # Parse workflow
        workflow_analysis = await doc_generator.parse_workflow_xml(content)
        
        # Generate documentation
        markdown_doc = doc_generator.generate_markdown_doc(workflow_analysis)
        alteryx_xml = doc_generator.generate_alteryx_xml(workflow_analysis)
        
        # Store the generated XML
        app.current_xml = alteryx_xml
        
        return {
            "success": True,
            "documentation": markdown_doc,
            "alteryx_xml": alteryx_xml,
            "analysis": workflow_analysis.dict()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/download-xml-pdf")
async def download_xml_pdf():
    """Download the workflow XML as PDF"""
    if not hasattr(app, 'current_xml'):
        raise HTTPException(
            status_code=400,
            detail="No workflow has been uploaded yet"
        )
    
    pdf_content = generate_xml_pdf(app.current_xml)
    
    return StreamingResponse(
        BytesIO(pdf_content),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=workflow-xml.pdf"}
    )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5507) 