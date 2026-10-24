import subprocess
import os
import sys

edge_exe = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if not os.path.exists(edge_exe):
    edge_exe = r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"

temp_profile = os.path.join(os.environ.get('TEMP', r'C:\Windows\Temp'), 'edge_pdf_profile')
os.makedirs(temp_profile, exist_ok=True)

html_file = os.path.abspath("User_Manual_and_UI_Prototype.html")
pdf_file = os.path.abspath("Digital_Evidence_Timeline_Analyzer_User_Guide.pdf")

args = [
    edge_exe,
    "--headless",
    "--disable-gpu",
    "--no-pdf-header-footer",
    f"--user-data-dir={temp_profile}",
    f"--print-to-pdf={pdf_file}",
    f"file:///{html_file.replace(os.sep, '/')}"
]

print("Running command:", " ".join(args))
result = subprocess.run(args, capture_output=True, text=True)
print("Exit code:", result.returncode)
print("Stdout:", result.stdout)
print("Stderr:", result.stderr)

if os.path.exists(pdf_file):
    print(f"SUCCESS: PDF generated successfully! Size: {os.path.getsize(pdf_file)} bytes")
else:
    print("FAILED: PDF not found.")
