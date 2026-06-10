import ast
import os
import re
from typing import Dict, List, Any

# Regular expressions for JS/TS/Java/Go pattern detection
ROUTE_REGEXES = [
    # JS/TS Express / Nest.js
    r'\.(?:get|post|put|delete|patch|options)\s*\(\s*["\']([^"\']+)["\']',
    r'@(?:Get|Post|Put|Delete|Patch)\s*\(\s*["\']([^"\']+)["\']',
    # Go Gin / Fiber
    r'\.(?:GET|POST|PUT|DELETE|PATCH)\s*\(\s*["\']([^"\']+)["\']',
    # Java Spring
    r'@(?:Get|Post|Put|Delete|Patch|Request)Mapping\s*\(\s*(?:value\s*=\s*)?["\']([^"\']+)["\']',
]

CLASS_REGEXES = [
    # JS/TS, Java, C#
    r'\bclass\s+([A-Za-z0-9_]+)\b',
    # Go structs
    r'\btype\s+([A-Za-z0-9_]+)\s+struct\b',
]

FUNC_REGEXES = [
    # JS/TS
    r'\bfunction\s+([A-Za-z0-9_]+)\b',
    r'\bconst\s+([A-Za-z0-9_]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>',
    # Java, C# (generic methods)
    r'(?:public|private|protected|internal)\s+(?:async\s+)?(?:[A-Za-z0-9_<>\[\]]+)\s+([A-Za-z0-9_]+)\s*\([^)]*\)',
    # Go functions
    r'\bfunc\s+(?:\([^)]+\)\s*)?([A-Za-z0-9_]+)\s*\(',
]

DB_MODEL_REGEXES = [
    # Sequelize / Mongoose / TypeORM / Spring JPA
    r'mongoose\.model\s*\(\s*["\']([^"\']+)["\']',
    r'@Entity',
    r'\bextends\s+Model\b',
    r'\bextends\s+BaseEntity\b',
]

class ASTParser:
    @staticmethod
    def parse_python_file(file_path: str) -> Dict[str, Any]:
        """Uses Python's native AST module to analyze Python code."""
        results = {
            "functions": [],
            "classes": [],
            "routes": [],
            "db_models": [],
            "imports": []
        }
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                code = f.read()
            
            tree = ast.parse(code, filename=file_path)
            
            for node in ast.walk(tree):
                # Import parsing
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        results["imports"].append(alias.name)
                elif isinstance(node, ast.ImportFrom):
                    results["imports"].append(node.module or "")

                # Class parsing
                elif isinstance(node, ast.ClassDef):
                    results["classes"].append(node.name)
                    # Check if DB Model
                    for base in node.bases:
                        if isinstance(base, ast.Name) and base.id in ("Base", "Model", "DeclarativeBase"):
                            results["db_models"].append(node.name)
                        elif isinstance(base, ast.Attribute) and base.attr in ("Base", "Model", "DeclarativeBase"):
                            results["db_models"].append(node.name)

                # Function parsing
                elif isinstance(node, ast.FunctionDef) or isinstance(node, ast.AsyncFunctionDef):
                    func_name = node.name
                    results["functions"].append(func_name)
                    
                    # Route detection from decorators
                    for decorator in node.decorator_list:
                        # e.g., @app.get('/path') or @router.post('/path')
                        if isinstance(decorator, ast.Call):
                            func_attr = None
                            if isinstance(decorator.func, ast.Attribute):
                                func_attr = decorator.func.attr
                            elif isinstance(decorator.func, ast.Name):
                                func_attr = decorator.func.id
                            
                            if func_attr in ["get", "post", "put", "delete", "patch", "route"]:
                                # Get the path argument
                                if decorator.args and isinstance(decorator.args[0], ast.Constant):
                                    path = decorator.args[0].value
                                    method = func_attr.upper() if func_attr != "route" else "GET"
                                    results["routes"].append({"path": path, "method": method, "handler": func_name})

        except Exception as e:
            # Fallback to general parsing if AST fails
            return ASTParser.parse_general_file(file_path)
            
        return results

    @staticmethod
    def parse_general_file(file_path: str) -> Dict[str, Any]:
        """Regex-based parser for JavaScript, TypeScript, Java, Go, etc."""
        results = {
            "functions": [],
            "classes": [],
            "routes": [],
            "db_models": [],
            "imports": []
        }
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()

            # Find Imports
            imports = re.findall(r'(?:import|require)\s+.*?["\']([^"\']+)["\']', content)
            results["imports"] = list(set(imports))

            # Find Classes
            for regex in CLASS_REGEXES:
                matches = re.findall(regex, content)
                results["classes"].extend(matches)

            # Find Functions
            for regex in FUNC_REGEXES:
                matches = re.findall(regex, content)
                results["functions"].extend(matches)

            # Find Routes
            for regex in ROUTE_REGEXES:
                # Find HTTP Method from expression
                matches = re.finditer(regex, content)
                for match in matches:
                    full_match = match.group(0)
                    path = match.group(1)
                    method = "GET"
                    for m in ["POST", "PUT", "DELETE", "PATCH", "post", "put", "delete", "patch"]:
                        if m in full_match:
                            method = m.upper()
                            break
                    results["routes"].append({"path": path, "method": method, "handler": ""})

            # Find DB Models
            for regex in DB_MODEL_REGEXES:
                if re.search(regex, content):
                    # Guessing model name from class/file name
                    base = os.path.basename(file_path).split('.')[0]
                    results["db_models"].append(base)

            # Clean lists
            results["functions"] = list(set(results["functions"]))
            results["classes"] = list(set(results["classes"]))
            results["db_models"] = list(set(results["db_models"]))

        except Exception:
            pass

        return results

    @classmethod
    def parse_file(cls, file_path: str) -> Dict[str, Any]:
        ext = os.path.splitext(file_path)[1].lower()
        if ext == ".py":
            return cls.parse_python_file(file_path)
        elif ext in [".js", ".jsx", ".ts", ".tsx", ".java", ".go", ".cs", ".php"]:
            return cls.parse_general_file(file_path)
        else:
            return {
                "functions": [],
                "classes": [],
                "routes": [],
                "db_models": [],
                "imports": []
            }
