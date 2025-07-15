from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from xml.dom import minidom
import io

def generate_xml_pdf(xml_content: str) -> bytes:
    """
    Convert XML content to a formatted PDF
    
    Args:
        xml_content (str): The XML content to convert
    
    Returns:
        bytes: The generated PDF content
    """
    # Create a buffer for the PDF
    buffer = io.BytesIO()
    
    # Create the PDF document
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=72
    )
    
    # Container for the 'Flowable' objects
    elements = []
    
    # Get styles
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name='CodeStyle',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        spaceAfter=10
    ))
    
    # Add title
    elements.append(Paragraph("Alteryx Workflow XML Documentation", styles['Title']))
    elements.append(Spacer(1, 12))
    
    # Pretty print the XML
    try:
        # Parse the XML string
        xml_dom = minidom.parseString(xml_content)
        # Pretty print with indentation
        pretty_xml = xml_dom.toprettyxml(indent="  ")
        
        # Split the XML into lines and create paragraphs
        for line in pretty_xml.split('\n'):
            if line.strip():
                elements.append(Paragraph(line, styles['CodeStyle']))
                
    except Exception as e:
        elements.append(Paragraph(f"Error formatting XML: {str(e)}", styles['Normal']))
    
    # Build the PDF
    doc.build(elements)
    
    # Get the value from the buffer
    pdf_value = buffer.getvalue()
    buffer.close()
    
    return pdf_value 