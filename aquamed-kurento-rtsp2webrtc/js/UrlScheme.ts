
module CitySoft {

	export enum UrlScheme {
		ftp,
		http,
		rtmp,
		rtsp,
		https,
		gopher,
		mailto,
		news,
		nntp,
		irc,
		smb,
		prospero,
		telnet,
		wais,
		xmpp,
		file,
		data,
		tel,

		//	And exotic ones
		afs,
		cid,
		mid,
		mailserver,
		nfs,
		tn3270,
		z39_50,
		skype,
		smsto,
		ed2k,
		market,
		stream,
		bitcoin,

		//	Browser URL schemes
		view_source,
		chrome,
        opera,

        //  And more
        ws, //  Web Socket
	}

}