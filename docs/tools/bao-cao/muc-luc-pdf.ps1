# Cập nhật mục lục (TOC) bằng Word rồi xuất PDF cạnh file .docx
# Chạy: powershell -ExecutionPolicy Bypass -File docs/tools/bao-cao/muc-luc-pdf.ps1
$docx = (Resolve-Path (Join-Path $PSScriptRoot '..\..\bao-cao\Bao-cao-CDTN2.docx')).Path
$pdf = [IO.Path]::ChangeExtension($docx, '.pdf')
$word = New-Object -ComObject Word.Application
$word.Visible = $false
try {
  $doc = $word.Documents.Open($docx)
  foreach ($toc in $doc.TablesOfContents) { $toc.Update() }
  $doc.Fields.Update() | Out-Null
  $doc.Save()
  $doc.ExportAsFixedFormat($pdf, 17)
  $doc.Close()
  Write-Output "Đã cập nhật mục lục và xuất $pdf"
} finally {
  $word.Quit()
}
