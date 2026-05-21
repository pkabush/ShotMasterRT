print("script_start")
local resolve = app:GetResolve() -- Works for Both Free and Studio Resolve
local projectManager = resolve:GetProjectManager()
local project = projectManager:GetCurrentProject()
local mp = project:GetMediaPool()

local p = io.popen("powershell.exe -NoProfile -STA -Command Get-Clipboard")
local text = p:read("*a")
p:close()


print("Clipboard:  ",text)
local full_path = text:match('"full_path"%s*:%s*"([^"]+)"')
print("FullPath:  ",full_path)
local imported_media = mp:ImportMedia(full_path)

local rootFolder = mp:GetRootFolder()
--mp:SetCurrentFolder(rootFolder)
local clip = mp:AppendToTimeline(imported_media)

