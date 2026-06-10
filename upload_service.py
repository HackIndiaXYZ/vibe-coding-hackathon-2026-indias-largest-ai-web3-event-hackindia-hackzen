import os
import zipfile
import shutil
import urllib.request
import subprocess

UPLOAD_DIR = "./uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class UploadService:
    @staticmethod
    def extract_zip(zip_file_path: str, extract_to: str) -> str:
        """Extracts a local ZIP file to a target directory."""
        if not zipfile.is_zipfile(zip_file_path):
            raise ValueError("Uploaded file is not a valid ZIP archive")
            
        os.makedirs(extract_to, exist_ok=True)
        EXCLUDE_DIR_PARTS = {
            "node_modules", "venv", ".git", "__pycache__", "dist", "build", 
            ".next", "target", ".idea", ".vscode", "env", "bin", "obj", "uploads"
        }
        with zipfile.ZipFile(zip_file_path, 'r') as zip_ref:
            # Filter members to exclude paths that contain any of our excluded directories
            valid_members = []
            for member in zip_ref.namelist():
                normalized = member.replace('\\', '/')
                parts = normalized.split('/')
                if any(part in EXCLUDE_DIR_PARTS for part in parts):
                    continue
                valid_members.append(member)
            zip_ref.extractall(extract_to, members=valid_members)
            
        # If the ZIP contained a single nested folder, return that nested folder path
        contents = os.listdir(extract_to)
        if len(contents) == 1 and os.path.isdir(os.path.join(extract_to, contents[0])):
            return os.path.join(extract_to, contents[0])
            
        return extract_to

    @staticmethod
    def clone_github_repo(repo_url: str, dest_dir: str) -> str:
        """Clones a GitHub repository locally with recursive zip download fallback."""
        os.makedirs(dest_dir, exist_ok=True)
        repo_url = repo_url.strip()
        
        # Clean git URL to ensure correct structure
        if repo_url.endswith("/"):
            repo_url = repo_url[:-1]
        if not repo_url.endswith(".git") and "github.com" in repo_url:
            # check if it needs .git suffix
            pass
            
        try:
            # 1. Attempt to run git clone --depth 1
            subprocess.run(
                ["git", "clone", "--depth", "1", repo_url, dest_dir], 
                check=True, 
                stdout=subprocess.DEVNULL, 
                stderr=subprocess.DEVNULL
            )
            return dest_dir
        except Exception:
            # 2. Fallback: Parse GitHub URL and download ZIP archive
            # Expected pattern: https://github.com/owner/name
            match = re.match(r"https?://(?:www\.)?github\.com/([^/]+)/([^/]+)", repo_url)
            if match:
                owner = match.group(1)
                name = match.group(2).replace(".git", "")
                
                # Try downloading from main branch then master branch
                zip_urls = [
                    f"https://github.com{owner}/{name}/archive/refs/heads/main.zip",
                    f"https://github.com/{owner}/{name}/archive/refs/heads/master.zip",
                    f"https://github.com/{owner}/{name}/zipball/main",
                    f"https://github.com/{owner}/{name}/zipball/master"
                ]
                
                temp_zip = os.path.join(UPLOAD_DIR, f"temp_{owner}_{name}.zip")
                download_success = False
                
                for url in zip_urls:
                    try:
                        urllib.request.urlretrieve(url, temp_zip)
                        download_success = True
                        break
                    except Exception:
                        continue
                        
                if download_success:
                    try:
                        extract_path = UploadService.extract_zip(temp_zip, dest_dir)
                        if os.path.exists(temp_zip):
                            os.remove(temp_zip)
                        return extract_path
                    except Exception as e:
                        if os.path.exists(temp_zip):
                            os.remove(temp_zip)
                        raise ValueError(f"Failed to extract downloaded GitHub ZIP: {str(e)}")
            
            raise ValueError("Git clone failed and could not retrieve public archive via zip download. Check URL accessibility.")
            
    @staticmethod
    def cleanup_directory(path: str):
        """Removes extracted files when no longer needed or on failure."""
        if os.path.exists(path):
            if os.path.isdir(path):
                shutil.rmtree(path, ignore_errors=True)
            else:
                os.remove(path)
import re
