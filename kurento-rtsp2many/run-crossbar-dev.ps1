# Get the ID and security principal of the current user account
$myWindowsID=[System.Security.Principal.WindowsIdentity]::GetCurrent()
$myWindowsPrincipal=new-object System.Security.Principal.WindowsPrincipal($myWindowsID)
 
# Get the security principal for the Administrator role
$adminRole=[System.Security.Principal.WindowsBuiltInRole]::Administrator
 
# Check to see if we are currently running "as Administrator"
if ($myWindowsPrincipal.IsInRole($adminRole))
{
   # We are running "as Administrator" - so change the title and background color to indicate this
   $Host.UI.RawUI.WindowTitle = $myInvocation.MyCommand.Definition + "(Elevated)"
   $Host.UI.RawUI.BackgroundColor = "DarkBlue"
   clear-host
}
else
{
   # We are not running "as Administrator" - so relaunch as administrator
   
   # Create a new process object that starts PowerShell
   $newProcess = New-Object System.Diagnostics.ProcessStartInfo "PowerShell";
   
   # Specify the current script path and name as a parameter
   $newProcess.Arguments = $myInvocation.MyCommand.Definition;
   $newProcess.WorkingDirectory = $PSScriptRoot;

   # Indicate that the process should be elevated
   $newProcess.Verb = "runas";
   
   # Start the new process
   [System.Diagnostics.Process]::Start($newProcess);
   
   # Exit from the current, unelevated, process
   exit
}
 
# Ok, we are elevated now!
CD $PSScriptRoot
























# Requires -RunAsAdministrator
function Get-NetworkStatistics { 
    $properties = "Protocol","LocalAddress","LocalPort" 
    $properties += "RemoteAddress","RemotePort","State","ProcessName","PID"

    netstat -ano | Select-String -Pattern "\s+(TCP|UDP)" | ForEach-Object {

        $item = $_.line.split(" ",[System.StringSplitOptions]::RemoveEmptyEntries)

        if($item[1] -notmatch "^\[::") 
        {            
            if (($la = $item[1] -as [ipaddress]).AddressFamily -eq "InterNetworkV6") 
            { 
               $localAddress = $la.IPAddressToString 
               $localPort = $item[1].split("\]:")[-1] 
            } 
            else 
            { 
                $localAddress = $item[1].split(":")[0] 
                $localPort = $item[1].split(":")[-1] 
            } 

            if (($ra = $item[2] -as [ipaddress]).AddressFamily -eq "InterNetworkV6") 
            { 
               $remoteAddress = $ra.IPAddressToString 
               $remotePort = $item[2].split("\]:")[-1] 
            } 
            else 
            { 
               $remoteAddress = $item[2].split(":")[0] 
               $remotePort = $item[2].split(":")[-1] 
            } 

            New-Object PSObject -Property @{ 
                PID = $item[-1] 
                ProcessName = (Get-Process -Id $item[-1] -ErrorAction SilentlyContinue).Name 
                Protocol = $item[0] 
                LocalAddress = $localAddress 
                LocalPort = $localPort 
                RemoteAddress =$remoteAddress 
                RemotePort = $remotePort 
                State = if($item[0] -eq ‘tcp’) {$item[3]} else {$null} 
            } | Select-Object -Property $properties 
        } 
    } 
}

function Get-PidListeningPort($port) {
    return [int](Get-NetworkStatistics | Where { $_.LocalPort -eq $port } | Foreach { return $_.PID })
}

function Get-UserConfirm($title, $message, $yesActionText = "Confirm", $noActionText = "Decline") {

    $yes = New-Object System.Management.Automation.Host.ChoiceDescription "&Yes", $yesActionText

    $no = New-Object System.Management.Automation.Host.ChoiceDescription "&No", $noActionText

    $options = [System.Management.Automation.Host.ChoiceDescription[]]($yes, $no)

    $result = $host.ui.PromptForChoice($title, $message, $options, 0) 

    return $result -eq 0;
}


$pswindow = (Get-Host).UI.RawUI;
$newsize = $pswindow.windowsize;
$newsize.Height = 20;
$newsize.Width = 60;
$pswindow.WindowSize = $newsize;


$port = 8080;
$crossbarPid = Get-PidListeningPort $port
$startCrossbar = $true;
if ($crossbarPid -ne 0) {
    $proc = Get-Process -Id $crossbarPid;
    $name = $proc.Name;
    Write-Host "Process ""$name"" (PID $crossbarPid) is already listening on $port." -ForegroundColor Yellow
    $confirm = Get-UserConfirm "Terminate" "Terminate process ""$name"" (PID $crossbarPid) to start Crossbar?"
    if ($confirm) {
        Write-Host "Terminating ""$name"" (PID $crossbarPid)..." -NoNewline;
        Kill -Id $crossbarPid;
        Write-Host "done."
    } else {
        Write-Host "Exiting.";
        $startCrossbar = $false;
    }
}

if ($startCrossbar) {
    Remove-Item ($PSScriptRoot + "\.crossbar\*.pid");
    
    Write-Host "Crossbar running here. Press ""Ctrl + c"" to stop it.";
    [console]::TreatControlCAsInput = $true;
    & crossbar start --config config-dev.json --logtofile
    
}

exit;
