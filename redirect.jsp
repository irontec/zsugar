<%
/*
 *	------ Zimbra - Sugar Zimblet Java Proxy ------
 *	----- Author: Irontec -- Date: 27/12/2010 -----
 *
 *	This JSP works as proxy for JSON petitions bettween Zsugar zimlet and Sugar REST api.
 *	It includes task done in server side, such as attachment handle.
 */
%>
<%@ page language="java" contentType="text/html; charset=UTF-8" import="java.net.*,java.io.*,java.util.*,java.text.*" %>
<%@ page language="java" contentType="text/html; charset=UTF-8" import="org.apache.commons.httpclient.*,org.apache.commons.httpclient.methods.*, org.apache.commons.httpclient.util.*" %>
<%@ page language="java" contentType="text/html; charset=UTF-8" import="org.apache.commons.fileupload.*,org.apache.commons.fileupload.disk.*, org.apache.commons.io.*" %>
<%@ page language="java" contentType="text/html; charset=UTF-8" import="biz.source_code.base64Coder.*" %>
<%@ page language="java" contentType="text/html; charset=UTF-8" import="javax.net.ssl.HttpsURLConnection, javax.net.ssl.SSLContext, javax.net.ssl.TrustManager, javax.net.ssl.X509TrustManager" %>
<%@ page language="java" contentType="text/html; charset=UTF-8" import="com.zimbra.common.util.*" %>

<%
	// Get Post data
	String input_type       = request.getParameter("input_type");
        String method           = request.getParameter("method");
        String response_type    = request.getParameter("response_type");
        String rest_data        = request.getParameter("rest_data");
        String sugar_url        = request.getParameter("sugar_url");
        String encoding 	= request.getCharacterEncoding();
        if (encoding == null) encoding = "UTF-8";

	// Special Treatment for set_note_attachment REST method
	if ( method.equals("set_note_attachment")){
		// Parse attachment URL
                int beg = rest_data.indexOf("file\":");
                int end = rest_data.indexOf("related_module_id\":");
		String attUrl = rest_data.substring(beg+7,end-3);
		String prefix = rest_data.substring(0,beg+7);
		String sufix  = rest_data.substring(end-3);

          try
          {
		// Download the file to the local temporary path
		String dirPath = System.getProperty("java.io.tmpdir", "/tmp");
		String filePath = dirPath + "/zsugar_att_" + System.currentTimeMillis();
		File readFile = new File (filePath);
		FileOutputStream readFileStream = new FileOutputStream(readFile.getPath());
		
		// Get Post Cookies
		javax.servlet.http.Cookie reqCookie[] = request.getCookies();
		org.apache.commons.httpclient.Cookie[] clientCookie = new org.apache.commons.httpclient.Cookie[reqCookie.length];
		String hostName = request.getServerName () + ":" + request.getServerPort();
	
		for (int i=0; i<reqCookie.length; i++) {
		        javax.servlet.http.Cookie cookie = reqCookie[i];
		        clientCookie[i] = new org.apache.commons.httpclient.Cookie (hostName,cookie.getName(), cookie.getValue(),"/",null,false);
    		}

		// Get Connection State
		HttpState state = new HttpState();
		state.addCookies (clientCookie);
	
		// Create a HTTP client with the actual state 
		HttpClient srcClient = new HttpClient();
		Enumeration headerNamesImg = request.getHeaderNames();
      		while(headerNamesImg.hasMoreElements()) {
	        	String headerNameImg = (String)headerNamesImg.nextElement();
	        	srcClient.getParams().setParameter(headerNameImg, request.getHeader(headerNameImg));
		}
		srcClient.setState (state);

		// Convert the URL
		int paramsbeg = attUrl.indexOf("id=")-1;
		String filename = attUrl.substring(0, paramsbeg);
		String getparam = attUrl.substring(paramsbeg, attUrl.length());
		attUrl = URIUtil.encodePath(filename, "ISO-8859-1") + getparam;
		//out.println(attUrl);

		// Download the Image
		GetMethod get = new GetMethod (attUrl);
		get.setFollowRedirects (true);
		srcClient.getHttpConnectionManager().getParams().setConnectionTimeout (10000);
		srcClient.executeMethod(get);

		// Copy the image to a local temporaly file
		ByteUtil.copy(get.getResponseBodyAsStream(), false, readFileStream, false);
		readFileStream.close();

		// Read the temporary file and output its Base64-values
		BufferedInputStream base64In = new BufferedInputStream(new FileInputStream(readFile.getPath()));

		int lineLength = 12288;
		byte[] buf = new byte[lineLength/4*3];

	
		while(true) {
		      int len = base64In.read(buf);
		      if (len <= 0) break;
		      prefix += new String(Base64Coder.encode(buf, 0, len));
		}
		base64In.close();
		
		// Update prameter rest_data with the binary data of the file
		rest_data = prefix + sufix;

	  } catch (Exception e) { 
		out.println("A problem occurried while handling attachment file:"+e.getMessage());
	  }
 	}



      // Create a HTTP client to foward REST petition
      HttpClient client = new HttpClient();
      Enumeration headerNames = request.getHeaderNames();
      while(headerNames.hasMoreElements()) {
      	String headerName = (String)headerNames.nextElement();
	client.getParams().setParameter(headerName, request.getHeader(headerName));
	//out.println(headerName+":"+request.getHeader(headerName));
      }

      BufferedReader br = null;

      // Set the input data for POST method
      PostMethod pmethod = new PostMethod(sugar_url);

      org.apache.commons.httpclient.methods.multipart.Part[] parts = {
		new org.apache.commons.httpclient.methods.multipart.StringPart("input_type",input_type, encoding),
		new org.apache.commons.httpclient.methods.multipart.StringPart("method", method, encoding),
		new org.apache.commons.httpclient.methods.multipart.StringPart("response_type", response_type, encoding),
		new org.apache.commons.httpclient.methods.multipart.StringPart("rest_data", rest_data, encoding)};


      try{
	pmethod.setRequestEntity(new org.apache.commons.httpclient.methods.multipart.MultipartRequestEntity(parts, pmethod.getParams()));
        int returnCode = client.executeMethod(pmethod);

        if(returnCode == HttpStatus.SC_NOT_IMPLEMENTED) {
                out.println("The Post method is not implemented by this URI");
                // still consume the response body
                pmethod.getResponseBodyAsString();
        } else {
                br = new BufferedReader(new InputStreamReader(pmethod.getResponseBodyAsStream()));
                String readLine;
		// Write the respone body
                while(((readLine = br.readLine()) != null)) {
		       out.println(readLine); 
                }
        }

      } catch (Exception e) {
		out.println(e);
      } finally {
        pmethod.releaseConnection();
        if(br != null) try { br.close(); } catch (Exception fe) {}
     }

%>
	

