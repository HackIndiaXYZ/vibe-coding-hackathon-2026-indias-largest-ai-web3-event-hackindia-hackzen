import os
from typing import Dict, List, Any
from .ast_parser import ASTParser

EXCLUDE_DIRS = {
    "node_modules", "venv", ".git", "__pycache__", "dist", "build", 
    ".next", "target", ".idea", ".vscode", "env", "bin", "obj"
}

SOURCE_EXTENSIONS = {
    ".py", ".js", ".jsx", ".ts", ".tsx", ".java", ".go", ".cs", ".php", ".rb", ".cpp", ".c", ".h"
}

TECH_INDICATORS = {
    "package.json": "Node.js / NPM",
    "requirements.txt": "Python / Pip",
    "Pipfile": "Python / Pipenv",
    "pyproject.toml": "Python / Poetry",
    "pom.xml": "Java / Maven",
    "build.gradle": "Java / Gradle",
    "go.mod": "Go / Modules",
    "Gemfile": "Ruby / Bundler",
    "composer.json": "PHP / Composer",
    "Dockerfile": "Docker Containerization",
    "docker-compose.yml": "Docker Compose Orchestration",
    "tsconfig.json": "TypeScript Project",
    "tailwind.config.js": "Tailwind CSS Styling",
    "webpack.config.js": "Webpack Bundler",
    "vite.config.ts": "Vite Bundler",
    "vite.config.js": "Vite Bundler",
}

class RepositoryScanner:
    @staticmethod
    def scan_directory(dir_path: str) -> Dict[str, Any]:
        file_count = 0
        folder_count = 0
        languages = {}
        tech_stack = set()
        
        aggregated_data = {
            "functions": [],
            "classes": [],
            "routes": [],
            "db_models": [],
            "imports": [],
            "raw_files": []
        }

        # Check directory validity
        if not os.path.exists(dir_path) or not os.path.isdir(dir_path):
            raise ValueError("Provided path is not a valid directory")

        for root, dirs, files in os.walk(dir_path):
            # Prune directories in place to prevent scanning them
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith(".")]
            
            folder_count += len(dirs)
            
            for file in files:
                if file.startswith("."):
                    continue
                file_count += 1
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, dir_path)
                
                # Check file indicators
                if file in TECH_INDICATORS:
                    tech_stack.add(TECH_INDICATORS[file])

                ext = os.path.splitext(file)[1].lower()
                if ext:
                    languages[ext] = languages.get(ext, 0) + 1

                # If source code file, run AST/Regex parsing
                if ext in SOURCE_EXTENSIONS:
                    try:
                        parse_res = ASTParser.parse_file(file_path)
                        aggregated_data["functions"].extend(parse_res.get("functions", []))
                        aggregated_data["classes"].extend(parse_res.get("classes", []))
                        aggregated_data["routes"].extend(parse_res.get("routes", []))
                        aggregated_data["db_models"].extend(parse_res.get("db_models", []))
                        aggregated_data["imports"].extend(parse_res.get("imports", []))
                        
                        # Store reference to source file metadata
                        aggregated_data["raw_files"].append({
                            "path": rel_path,
                            "ext": ext,
                            "lines": len(open(file_path, "r", encoding="utf-8", errors="ignore").readlines())
                        })
                    except Exception:
                        pass

        # Deduplicate and format aggregated arrays
        aggregated_data["functions"] = list(set(aggregated_data["functions"]))
        aggregated_data["classes"] = list(set(aggregated_data["classes"]))
        aggregated_data["db_models"] = list(set(aggregated_data["db_models"]))
        aggregated_data["imports"] = list(set(aggregated_data["imports"]))
        
        # Deduplicate routes based on path and method
        seen_routes = set()
        unique_routes = []
        for r in aggregated_data["routes"]:
            route_key = (r["path"], r["method"])
            if route_key not in seen_routes:
                seen_routes.add(route_key)
                unique_routes.append(r)
        aggregated_data["routes"] = unique_routes

        # Map extensions to nice language names
        language_mapping = {
            ".py": "Python",
            ".js": "JavaScript",
            ".ts": "TypeScript",
            ".tsx": "React / TypeScript",
            ".jsx": "React / JavaScript",
            ".java": "Java",
            ".go": "Go",
            ".cs": "C#",
            ".php": "PHP",
            ".rb": "Ruby",
            ".cpp": "C++",
            ".c": "C",
            ".h": "C Header",
            ".html": "HTML",
            ".css": "CSS",
            ".json": "JSON",
            ".yaml": "YAML",
            ".yml": "YAML",
            ".md": "Markdown",
            ".sql": "SQL",
        }

        formatted_languages = {}
        for ext, count in languages.items():
            name = language_mapping.get(ext, ext.upper().replace(".", ""))
            formatted_languages[name] = formatted_languages.get(name, 0) + count

        return {
            "file_count": file_count,
            "folder_count": folder_count,
            "languages": formatted_languages,
            "tech_stack": list(tech_stack),
            "parsed_data": aggregated_data
        }
