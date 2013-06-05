//######common libs######//

function $$(str){
	var parts = str.split("%?");
	var results = [];

	for(var i in parts){
		results.push(parts[i]);

		if(i == parts.length - 1){
			break;
		}

		results.push(arguments[parseInt(i, 10) + 1]);
	}

	return results.join("")
}

function trim(str, trimValue)
{
	var startPos = 0;
	for(var i = 0; i < str.length; i++)
	{
		if(trimValue.indexOf(str[i]) == -1)
		{
			startPos = i;
			break;
		}
	}

	var endPos = str.length - 1;
	for(var i = endPos; i >= startPos; i--)
	{
		if(trimValue.indexOf(str[i]) == -1)
		{
			endPos = i;
			break;
		}
	}

	return str.substr(startPos, endPos + 1);
}

function concatPath(pathParts)
{
	var ret = "";

	for(var i = 0; i < pathParts.length; i++)
	{
		ret += pathParts[i] + FileSystemLister.prototype.PATHSEP;
	}

	return ret;
}

function win32PathLastPart(path)
{
	if(path.length <= 2)
	{
		throw "bad path: " + path;
	}

	// handle path like D:\
	if(path.length == 3)
	{
		return path;
	}

	for(var i = path.length - 1; i >= 0; i--)
	{
		if(path[i] == "\\")
		{
			return path.substr(i+1);
		}
	}

    throw "bad path: " + path;
}

function win32GetBaseDir(path)
{
	for(var i = path.length - 1; i >= 0; i--)
	{
		if(path[i] == "\\")
		{
			return path.slice(0, i);
		}
	}

	throw "bad path";
}

function getFileBaseName(filename)
{
	for(var i = filename.length - 1; i >=0; i--)
	{
		if(filename[i] == ".")
		{
			return filename.slice(0, i);
		}
	}

	return filename;
}
/* the following code is used to build a custom dialog, but it is slow, so we do not use it any longer 

//######Object alias##########//
Tfs = Ti.Filesystem;

//######FileSystemLister######//

function FileSystemLister(ct){
	this.ct = ct;
	this.pathItems = [];
	this.selectedFile = "";
}

FileSystemLister.prototype.PATHSEP = (Ti.getPlatform() == "win32") ? "\\" : "/";
FileSystemLister.prototype.PATHSEPHTML = (Ti.getPlatform() == "win32") ? "\\" : "&#47";

FileSystemLister.prototype.listRoot = function() {
	this.listPath("");
}

FileSystemLister.prototype.listPath = function(path){
	this.selectedFile = "";

	var self = this;
	$.each(["file-nav", "file-items"], function(i, item){
		if(self.ct.find($$("#%?", item)).length == 0)
		{
			self.ct.append($$("<div id='%?'></div>", item));
		}
	});

	var dirs;
    if(path == "")
    {
		var dirs = Ti.Filesystem.getRootDirectories();
	}
	else
	{
		var directory = Ti.Filesystem.getFile(path);
		dirs = directory.getDirectoryListing();
	}

	var fileItems = this.ct.find("#file-items");
	fileItems.empty();

    this.pathItems = [];
    this.pathItems.push("Disk");
	if(Ti.getPlatform() == "win32")
	{
		if(path != "")
		{
			this.pathItems.push(path.substr(0, 3));
			var leftPath = trim(path.substr(4, path.length), this.PATHSEP);

			if(leftPath != "")
			{
				$.merge(this.pathItems, trim(path.substr(4, path.length), this.PATHSEP).split(this.PATHSEP));
			}
		}
	}
	else
	{
		// TODO: to support other platform
	}

	var fileNav = $("#file-nav").empty();
	for(var i = 0; i < this.pathItems.length; i++)
	{
		var navItem = $($$("<span class='file-nav-item'><a href='#' class='inc'>%?</a></span><span class='file-nav-sep'>%?</span>", 
			               this.pathItems[i], FileSystemLister.prototype.PATHSEPHTML));
		navItem.find(".inc").click((function(){
			var index = arguments[1];
			var ctx = arguments[2];
			var currPathItems = arguments[0].slice(1, index + 1);		
            return function(){
            	// empty path, just list root
				if(currPathItems.length == 0){
					ctx.listRoot();
				}
				else
				{
					ctx.listPath(concatPath(currPathItems));
				}
		    }
		})(this.pathItems, i, this));
		fileNav.append(navItem);
	}

	for(var i = 0; i < dirs.length; i++){
		this.createItem(dirs[i])
	}
}

FileSystemLister.prototype.createItem = function(f)
{
	var parent = this.ct.find("#file-items");
	var id = this.createId(f.toString());
	var name = f.name();
	if(f.isDirectory()){
		name = win32PathLastPart(f.nativePath());
	}
	var iconName = "icon-file";
	if(f.isDirectory()){
		iconName = "icon-folder-close";
	}

	var itemHtml = $$("<p><span class='file-item' id='%?' data-name='%?'><span class='%?'></span>%?</span></p>",
		                     id, 
		                     name,
		                     iconName,
		                     name);
	var item = $(itemHtml);
	item.click((function(){
		var ctx = arguments[0];
		var f = arguments[1];
		var item = arguments[2];

		var paths = ctx.pathItems.slice();
		paths.shift();
		paths.push(name);

        if(f.isDirectory())
        {
			return function(){

				ctx.listPath(concatPath(paths));
			}
		}
		else
		{
			return function()
			{
				ctx.selectedFile = paths.join("\\");
				$(".file-item").removeClass("active");
				item.find('.file-item').addClass("active");
			}
		}
	})(this, f, item));

	parent.append(item);
}

FileSystemLister.prototype.createId = function(p){
	return ("fi-" + p).replace(/:/g,"-").replace(/\\/g, "").replace(/\//g, "");
}
*/


// global. ugly.. I know
var getMediaInfoProcess;
Ti.UI.getCurrentWindow().addEventListener("close", function(event){
	if(getMediaInfoProcess){
		getMediaInfoProcess.kill();
	}
});

$(function(){
	var FFMPEG = Ti.App.appURLToPath("app://ffmpeg/bin/ffmpeg.exe");

	function startAndLog(cmd, onExit)
	{
		getMediaInfoProcess = Ti.Process.createProcess(cmd);

		getMediaInfoProcess.setOnReadLine(function(data){
			$("#log-info").append($$("<p>%?</p>", data.toString()));
			$("#log-info").scrollTop($("#log-info")[0].scrollHeight);
		});

		if(onExit)
		{
			getMediaInfoProcess.setOnExit(onExit);
		}
		//getMediaInfoProcess.getStderr().attach(getMediaInfoProcess.getStdout());
		getMediaInfoProcess.launch();
	}

	function displayMediaFileInfo(filePath){
		startAndLog([FFMPEG, "-i", filePath], undefined);
		$("#source-file").val(filePath);
		$("#start").removeClass("disabled");
	}

	$("#open-file").tooltip();

    $("#open-file").click(function(){
    	Ti.UI.getCurrentWindow().openFileChooserDialog(function(data){
    		if(data.length > 0)
    		{
    			displayMediaFileInfo(data[0]);
    		}
    	}, {
    		"multiple": false,
    		"title": "Please choose a file"
    	});
    });

	$(".nav li").click(function(){
		$(".nav li").removeClass("active");
		$(this).addClass("active");
		$(".views").addClass('view-hide');
		var targetId = $(this).data("target");

		$("#" + targetId).removeClass('view-hide');

		if(targetId == "log-view")
		{
			$("#log-info").scrollTop($("#log-info")[0].scrollHeight);
		}
	});

	$("#start").click(function(){
		if($(this).hasClass("disabled"))
		{
			return;
		}
        
        var sourcePath = $("#source-file").val();
        var baseDir = win32GetBaseDir(sourcePath);
		var fileName = win32PathLastPart(sourcePath);

		var cmd = [FFMPEG, "-y", "-i", sourcePath];
		var transSetting = $("#trans-setting").val();

		var commonAudioSetting = ["-acodec", "libvo_aacenc", "-ac", "2", "-ar", "48000", "-ab", "160k"];

		//x264 preset:
		//ultrafast, superfast, veryfast, faster, fast, medium, slow, slower, veryslow, placebo
		var commonVideoSetting = ["-r", "30", "-vcodec", "libx264", "-keyint_min", "250"];

        if(transSetting == "copy")
        {
        	$.merge(cmd, ["-acodec", "copy", "-vcodec", "copy"]);
        }
        else if(transSetting == "copy_video")
        {
        	$.merge(cmd, ["-vcodec", "copy"]);
        	$.merge(cmd, commonAudioSetting);
        }
        else if(transSetting == "same_quality")
        {
        	$.merge(cmd, ["-acodec", "libvo_aacenc", "-vcodec", "libx264", "-qscale", "0"]);
        }
        else if(transSetting == "240p")
        {
        	//320x240
        	$.merge(cmd, ["-vf", "scale=trunc(oh*a/2)*2:240"]);
        	$.merge(cmd, commonAudioSetting);
        	$.merge(cmd, commonVideoSetting);
        	$.merge(cmd, ["-preset", "fast"]);
        	$.merge(cmd, ["-profile:v", "baseline", "-level", "30"])
        }
        else if(transSetting == "320p")
        {
        	//480x320
        	$.merge(cmd, ["-vf", "scale=trunc(oh*a/2)*2:320"]);
        	$.merge(cmd, commonAudioSetting);
        	$.merge(cmd, commonVideoSetting);
        	$.merge(cmd, ["-preset", "fast"]);
        	$.merge(cmd, ["-profile:v", "baseline", "-level", "30"])
        }
        else if(transSetting == "480p")
        {
        	//640x480
        	$.merge(cmd, ["-vf", "scale=trunc(oh*a/2)*2:480"]);
        	$.merge(cmd, commonAudioSetting);
        	$.merge(cmd, commonVideoSetting);
        	$.merge(cmd, ["-preset", "fast"]);
        	$.merge(cmd, ["-profile:v", "main", "-level", "30"])
        }
        else if(transSetting == "720p")
        {
        	//1280x720
        	$.merge(cmd, ["-vf", "scale=trunc(oh*a/2)*2:720"]);
        	$.merge(cmd, commonAudioSetting);
        	$.merge(cmd, commonVideoSetting);
        	$.merge(cmd, ["-preset", "fast"]);
        	$.merge(cmd, ["-profile:v", "main", "-level", "30"])
        }
        else if(transSetting == "1080p")
        {
        	//1920x1080
        	$.merge(cmd, ["-vf", "scale=trunc(oh*a/2)*2:1080"]);
        	$.merge(cmd, commonAudioSetting);
        	$.merge(cmd, commonVideoSetting);
        	$.merge(cmd, ["-preset", "fast"]);
        	$.merge(cmd, ["-profile:v", "high", "-level", "41"])
        }

		var dstFileName = getFileBaseName(fileName) + "-" + transSetting + "." + $("#format").val();

		cmd.push(baseDir + "\\" + dstFileName);

        var self = $(this);
		startAndLog(cmd, function(){
			$("#stop").addClass("hide");
			$(self).removeClass("disabled").html("Start");
		});

		$("#stop").removeClass("hide");
		$(this).addClass("disabled").html("Converting...");
	});

	$("#stop").click(function(){
		getMediaInfoProcess.kill();
	});
}
);