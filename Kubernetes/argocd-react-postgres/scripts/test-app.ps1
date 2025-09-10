\
    # Quick test calls
    Write-Host "Hitting web root:"
    try {
      $r = Invoke-WebRequest http://localhost:30080 -UseBasicParsing
      Write-Host $r.StatusCode $r.StatusDescription
    } catch {
      Write-Host "Failed to reach web service on http://localhost:30080"
    }

    Write-Host "Hitting API:"
    try {
      $x = Invoke-WebRequest http://localhost:30080/api/hello -UseBasicParsing
      Write-Host $x.Content
    } catch {
      Write-Host "Failed to reach API via web proxy http://localhost:30080/api/hello"
    }
