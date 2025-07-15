from flask import Flask, request, jsonify
import xml.etree.ElementTree as ET

app = Flask(__name__)

def parse_workflow_xml(xml_content):
    """Parse Alteryx workflow XML and extract nodes and connections."""
    try:
        # Parse XML string
        root = ET.fromstring(xml_content)
        
        # Extract nodes
        nodes = []
        for node in root.findall('.//Node'):
            tool_id = node.get('ToolID', '')
            
            # Get tool type
            gui_settings = node.find('GuiSettings')
            tool_type = 'Unknown'
            if gui_settings is not None:
                plugin = gui_settings.get('Plugin', '')
                if plugin:
                    tool_type = plugin.split('.')[-1]
            
            # Get position
            position = None
            pos_elem = node.find('.//Position')
            if pos_elem is not None:
                x = pos_elem.get('x')
                y = pos_elem.get('y')
                if x and y:
                    position = {'x': int(x), 'y': int(y)}
            
            # Get configuration
            config = {}
            config_elem = node.find('.//Configuration')
            if config_elem is not None:
                for child in config_elem:
                    config[child.tag] = child.text or child.attrib
            
            nodes.append({
                'toolId': tool_id,
                'toolType': tool_type,
                'position': position,
                'configuration': config
            })
        
        # Extract connections
        connections = []
        for conn in root.findall('.//Connection'):
            origin = conn.find('Origin')
            destination = conn.find('Destination')
            
            if origin is not None and destination is not None:
                connections.append({
                    'originToolId': origin.get('ToolID', ''),
                    'originConnection': origin.get('Connection', ''),
                    'destinationToolId': destination.get('ToolID', ''),
                    'destinationConnection': destination.get('Connection', '')
                })
        
        return {
            'success': True,
            'nodes': nodes,
            'connections': connections
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

@app.route('/parse-workflow', methods=['POST'])
def parse_workflow():
    """API endpoint to parse Alteryx workflow XML."""
    try:
        data = request.get_json()
        xml_content = data.get('xmlContent')
        
        if not xml_content:
            return jsonify({'success': False, 'error': 'No XML content provided'})
        
        result = parse_workflow_xml(xml_content)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
