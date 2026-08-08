; Custom NSIS installer script
; POS সিস্টেম - Windows Installer

!macro customHeader
  ; Custom header for installer
!macroend

!macro preInit
  ; Pre-initialization
!macroend

!macro customInit
  ; Custom initialization
!macroend

!macro customInstall
  ; Custom install actions
!macroend

!macro customUnInstall
  ; Custom uninstall actions
!macroend

!macro customInstallMode
  ; Custom install mode - allow user to choose
  StrCpy $isForceCurrentInstall "0"
  StrCpy $isAdminInstall "0"
!macroend

; Customize NSIS pages
!macro NSIShookInit
  ; This runs during initialization
!macroend
