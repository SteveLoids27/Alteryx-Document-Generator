import xml.etree.ElementTree as ET

class AlteryxDocGenerator:
    def __init__(self):
        self.workflow_xml = None
        self.documentation = ""
        
        # Pin: Comprehensive tool descriptions based on Alteryx Designer documentation
        self.tool_descriptions = {
            # In/Out Tools
            "Input Data": {
                "category": "In/Out",
                "xml_name": "AlteryxBasePluginsGui.DbFileInput.DbFileInput",
                "description": "Reads data from various sources like files, databases, or cloud storage",
                "user_role": "Basic, Full",
                "common_uses": ["Reading data files", "Database connections", "Cloud storage access"]
            },
            "Output Data": {
                "category": "In/Out",
                "xml_name": "AlteryxBasePluginsGui.DbFileOutput.DbFileOutput",
                "description": "Writes data to files, databases, or other destinations",
                "user_role": "Basic, Full",
                "common_uses": ["Writing to databases", "Creating data files", "Data export"]
            },
            "Browse": {
                "category": "In/Out",
                "xml_name": "AlteryxBasePluginsGui.BrowseV2.BrowseV2",
                "description": "Views data at any point in the workflow",
                "user_role": "Basic, Full",
                "common_uses": ["Data inspection", "Debugging", "Result verification"]
            },
            
            # Preparation Tools
                     {
            "Auto Field": {
                "category": "Preparation",
                "xml_name": "AlteryxBasePluginsGui.AutoField.AutoField",
                "description": "Automatically detects and sets optimal field types and sizes",
                "user_role": "Basic, Full",
                "common_uses": ["Data type optimization", "Field size adjustment", "Schema cleanup"],
                "input_output": {
                    "inputs": ["Any data type"],
                    "outputs": ["Optimized data types"]
                }
            },
            "Create Samples": {
                "category": "Preparation",
                "xml_name": "Predictive Tools\\Create_Samples.yxmc",
                "description": "Creates training and testing datasets for predictive analytics",
                "user_role": "Full",
                "common_uses": ["Model validation", "Cross-validation", "Holdout samples"],
                "input_output": {
                    "inputs": ["Raw dataset"],
                    "outputs": ["Training data", "Testing data"]
                }
            },
            "Data Cleanse Pro": {
                "category": "Preparation",
                "xml_name": "AlteryxBasePluginsGui.DataCleansePro.DataCleansePro",
                "description": "Advanced data cleaning with standardization and validation",
                "user_role": "Basic, Full",
                "common_uses": ["Data standardization", "Value correction", "Format consistency"],
                "input_output": {
                    "inputs": ["Raw data"],
                    "outputs": ["Cleansed data"]
                }
            },
            "Data Cleansing": {
                "category": "Preparation",
                "xml_name": "Cleanse.yxmc",
                "description": "Basic data cleaning operations",
                "user_role": "Full",
                "common_uses": ["Remove special characters", "Standardize case", "Basic cleaning"],
                "input_output": {
                    "inputs": ["Text data"],
                    "outputs": ["Cleaned text"]
                }
            },
            "Filter": {
                "category": "Preparation",
                "xml_name": "AlteryxBasePluginsGui.Filter.Filter",
                "description": "Splits data stream based on conditions",
                "user_role": "Basic, Full",
                "common_uses": ["Data filtering", "Record selection", "Stream splitting"],
                "input_output": {
                    "inputs": ["Single input"],
                    "outputs": ["True output", "False output"]
                }
            },
            "Formula": {
                "category": "Preparation",
                "xml_name": "AlteryxBasePluginsGui.Formula.Formula",
                "description": "Creates or modifies fields using expressions",
                "user_role": "Basic, Full",
                "common_uses": ["Calculations", "Field creation", "Data transformation"],
                "input_output": {
                    "inputs": ["Any data type"],
                    "outputs": ["Calculated fields"]
                }
            },
            "Generate Rows": {
                "category": "Preparation",
                "xml_name": "AlteryxBasePluginsGui.GenerateRows.GenerateRows",
                "description": "Creates new records based on specified patterns",
                "user_role": "Basic, Full",
                "common_uses": ["Sequence generation", "Test data creation", "Date series"],
                "input_output": {
                    "inputs": ["Optional input"],
                    "outputs": ["Generated rows"]
                }
            },
            "Imputation": {
                "category": "Preparation",
                "xml_name": "Imputation_v3.yxmc",
                "description": "Fills missing values using various methods",
                "user_role": "Full",
                "common_uses": ["Missing value handling", "Data completion", "Statistical imputation"],
                "input_output": {
                    "inputs": ["Data with missing values"],
                    "outputs": ["Completed data"]
                }
            },
            "Multi-Field Binning": {
                "category": "Preparation",
                "xml_name": "MultiFieldBinning_v2.yxmc",
                "description": "Groups numeric values into bins across multiple fields",
                "user_role": "Full",
                "common_uses": ["Data categorization", "Range grouping", "Multiple field binning"],
                "input_output": {
                    "inputs": ["Numeric fields"],
                    "outputs": ["Binned categories"]
                }
            },
            "Multi-Field Formula": {
                "category": "Preparation",
                "xml_name": "AlteryxBasePluginsGui.MultiFieldFormula.MultiFieldFormula",
                "description": "Applies formula to multiple fields simultaneously",
                "user_role": "Basic, Full",
                "common_uses": ["Batch calculations", "Mass updates", "Field standardization"],
                "input_output": {
                    "inputs": ["Multiple fields"],
                    "outputs": ["Transformed fields"]
                }
            },
            "Multi-Row Formula": {
                "category": "Preparation",
                "xml_name": "AlteryxBasePluginsGui.MultiRowFormula.MultiRowFormula",
                "description": "Creates calculations using values from multiple rows",
                "user_role": "Basic, Full",
                "common_uses": ["Running totals", "Moving averages", "Row comparisons"],
                "input_output": {
                    "inputs": ["Sorted data"],
                    "outputs": ["Calculated fields"]
                }
            },
            "Oversample Field": {
                "category": "Preparation",
                "xml_name": "Predictive Tools\\Oversample_Field.yxmc",
                "description": "Balances dataset by oversampling minority classes",
                "user_role": "Full",
                "common_uses": ["Class balancing", "Minority class handling", "Sample weighting"],
                "input_output": {
                    "inputs": ["Imbalanced data"],
                    "outputs": ["Balanced data"]
                }
            },
            "Random % Sample": {
                "category": "Preparation",
                "xml_name": "RandomRecords.yxmc",
                "description": "Randomly samples a percentage of records",
                "user_role": "Full",
                "common_uses": ["Data sampling", "Record selection", "Dataset reduction"],
                "input_output": {
                    "inputs": ["Full dataset"],
                    "outputs": ["Sampled data", "Remaining data"]
                }
            },
            "Rank": {
                "category": "Preparation",
                "xml_name": "AlteryxBasePluginsGui.Ranking.Ranking",
                "description": "Assigns ranks to records based on field values",
                "user_role": "Full",
                "common_uses": ["Record ranking", "Position assignment", "Order statistics"],
                "input_output": {
                    "inputs": ["Sorted data"],
                    "outputs": ["Ranked data"]
                }
            },
            "Record ID": {
                "category": "Preparation",
                "xml_name": "AlteryxBasePluginsGui.RecordID.RecordID",
                "description": "Adds unique identifier to each record",
                "user_role": "Basic, Full",
                "common_uses": ["Row numbering", "Unique ID generation", "Record tracking"],
                "input_output": {
                    "inputs": ["Any data"],
                    "outputs": ["Data with IDs"]
                }
            },
            "Sample": {
                "category": "Preparation",
                "xml_name": "AlteryxBasePluginsGui.Sample.Sample",
                "description": "Selects records using various sampling methods",
                "user_role": "Basic, Full",
                "common_uses": ["First N records", "Every Nth record", "Random sampling"],
                "input_output": {
                    "inputs": ["Input data"],
                    "outputs": ["Sampled records"]
                }
            },
            "Select": {
                "category": "Preparation",
                "xml_name": "AlteryxBasePluginsGui.AlteryxSelect.AlteryxSelect",
                "description": "Selects, renames, and reorders fields",
                "user_role": "Basic, Full",
                "common_uses": ["Field selection", "Field renaming", "Type conversion"],
                "input_output": {
                    "inputs": ["Any data"],
                    "outputs": ["Selected fields"]
                }
            },
            "Select Records": {
                "category": "Preparation",
                "xml_name": "SelectRecords.yxmc",
                "description": "Selects records based on position or condition",
                "user_role": "Full",
                "common_uses": ["Record filtering", "Data subsetting", "Position-based selection"],
                "input_output": {
                    "inputs": ["Input data"],
                    "outputs": ["Selected records"]
                }
            },
            "Sort": {
                "category": "Preparation",
                "xml_name": "AlteryxBasePluginsGui.Sort.Sort",
                "description": "Sorts records based on field values",
                "user_role": "Basic, Full",
                "common_uses": ["Data ordering", "Multi-field sort", "Custom sorting"],
                "input_output": {
                    "inputs": ["Unsorted data"],
                    "outputs": ["Sorted data"]
                }
            },
            "Tile": {
                "category": "Preparation",
                "xml_name": "AlteryxBasePluginsGui.Tile.Tile",
                "description": "Assigns tile numbers to grouped records",
                "user_role": "Full",
                "common_uses": ["Group numbering", "Data partitioning", "Equal-sized groups"],
                "input_output": {
                    "inputs": ["Grouped data"],
                    "outputs": ["Tiled data"]
                }
            },
            "Unique": {
                "category": "Preparation",
                "xml_name": "AlteryxBasePluginsGui.Unique.Unique",
                "description": "Removes duplicate records",
                "user_role": "Basic, Full",
                "common_uses": ["Deduplication", "Distinct values", "Unique records"],
                "input_output": {
                    "inputs": ["Data with duplicates"],
                    "outputs": ["Unique records", "Duplicate records"]
                }
            }
        }
            
            # Join Tools
            "Join": {
                "category": "Join",
                "xml_name": "AlteryxBasePluginsGui.Join.Join",
                "description": "Combines records from two data streams based on common fields",
                "user_role": "Basic, Full",
                "common_uses": ["Data merging", "Lookup operations", "Relationship building"]
            },
            "Union": {
                "category": "Join",
                "xml_name": "AlteryxBasePluginsGui.Union.Union",
                "description": "Combines records from multiple data streams",
                "user_role": "Basic, Full",
                "common_uses": ["Data combination", "Multiple source integration", "Vertical stacking"]
            },
            
            # Parse Tools
            "Text To Columns": {
                "category": "Parse",
                "xml_name": "AlteryxBasePluginsGui.TextToColumns.TextToColumns",
                "description": "Splits text fields into multiple columns",
                "user_role": "Basic, Full",
                "common_uses": ["Text parsing", "Delimiter-based splitting", "Data extraction"]
            },
            
            # Transform Tools
            "Summarize": {
                "category": "Transform",
                "xml_name": "AlteryxBasePluginsGui.Summarize.Summarize",
                "description": "Groups and aggregates data",
                "user_role": "Basic, Full",
                "common_uses": ["Data aggregation", "Statistical analysis", "Group operations"]
            },
            "Sort": {
                "category": "Transform",
                "xml_name": "AlteryxBasePluginsGui.Sort.Sort",
                "description": "Sorts records based on field values",
                "user_role": "Basic, Full",
                "common_uses": ["Data ordering", "Sequence creation", "Priority sorting"]
            },
            
            # Predictive Tools
            "Logistic Regression": {
                "category": "Predictive",
                "xml_name": "AlteryxPredictive.Logistic_Regression",
                "description": "Builds logistic regression models for classification",
                "user_role": "Full",
                "common_uses": ["Binary classification", "Probability prediction", "Category prediction"]
            }
        }

    def generate_alteryx_xml(self, analysis: WorkflowAnalysis) -> str:
        """
        Generate standard Alteryx workflow XML format
        Returns formatted XML string matching Alteryx's structure
        """
        # Create root element
        root = ET.Element("AlteryxDocument")
        root.set("yxmdVer", analysis.yxmd_version or "2023.1")
        
        # Add Properties
        props = ET.SubElement(root, "Properties")
        ET.SubElement(props, "MetaInfo")
        ET.SubElement(props, "Name").text = analysis.name
        if analysis.creator:
            ET.SubElement(props, "Creator").text = analysis.creator
        if analysis.description:
            ET.SubElement(props, "Description").text = analysis.description
        
        # Add Nodes (Tools)
        for tool in analysis.tools:
            node = ET.SubElement(root, "Node")
            node.set("ToolID", tool.tool_id)
            if tool.plugin:
                node.set("Plugin", tool.plugin)
            
            # GUI Settings
            gui = ET.SubElement(node, "GuiSettings")
            if tool.position:
                gui.set("Plugin", tool.plugin or "")
                pos = ET.SubElement(gui, "Position")
                pos.set("x", tool.position.get("x", "0"))
                pos.set("y", tool.position.get("y", "0"))
            
            # Properties
            props = ET.SubElement(node, "Properties")
            
            # Configuration
            if tool.configuration:
                config = ET.SubElement(props, "Configuration")
                for key, value in tool.configuration.items():
                    prop = ET.SubElement(config, "Property")
                    prop.set("name", key)
                    if value is not None:
                        prop.text = str(value)
            
            # Connections
            if tool.connections:
                for conn in tool.connections:
                    connection = ET.SubElement(node, "Connection")
                    connection.set("name", conn)
        
        # Add Constants if any
        if analysis.workflow_constants:
            constants = ET.SubElement(root, "Constants")
            for name, value in analysis.workflow_constants.items():
                constant = ET.SubElement(constants, "Constant")
                constant.set("name", name)
                constant.set("value", str(value))
        
        # Format the XML with proper indentation
        ET.indent(root, space="  ")
        return ET.tostring(root, encoding="unicode", xml_declaration=True)
