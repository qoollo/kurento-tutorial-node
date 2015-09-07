@ECHO OFF

SET vlc="C:\Program Files\VideoLAN\VLC\vlc"
IF NOT EXIST %vlc% SET vlc="C:\Program Files (x86)\VideoLAN\VLC\vlc"

start "" %vlc% -I qt --rc-quiet --verbose=1 --repeat --live-caching=200 screen:// :screen-fps=15.000000 :screen-left=0 :screen-top=0 :screen-width=800 :screen-height=450 :sout=#transcode{vcodec=h264,venc=x264{keyint=45,profile=baseline,level=2.2,preset=ultrafast,tune=zerolatency,opencl=true,vbv-maxrate=400,vbv-bufsize=400,vbv-init=0,9},,vb=0,threads=2,fps=15.000000,scale=auto,acodec=none,width=640,height=480}:rtp{sdp=rtsp://:8091/grabber.sdp}

start "" %vlc% -I qt --rc-quiet --verbose=1 --repeat --live-caching=200 screen:// :screen-fps=15.000000 :screen-left=0 :screen-top=450 :screen-width=800 :screen-height=450 :sout=#transcode{vcodec=h264,venc=x264{keyint=45,profile=baseline,level=2.2,preset=ultrafast,tune=zerolatency,opencl=true,vbv-maxrate=400,vbv-bufsize=400,vbv-init=0,9},,vb=0,threads=2,fps=15.000000,scale=auto,acodec=none,width=640,height=480}:rtp{sdp=rtsp://:8092/grabber.sdp}

PAUSE NUL