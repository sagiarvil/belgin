<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1" />
<title></title>
</head>
<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.12.0/jquery.min.js"></script>
<script>

function ShowHide()
{ 
var responseCode=$("#ResponseCode").val();
if(responseCode="00")
{
$("#submit").show()
}
else $("#submit"). hide()
}

window.onload = ShowHide;


</script>
<body>

<%
Dim gv_AuthenticationResponse,node
Function URLDecode(str) 
        str = Replace(str, "+", " ") 
        For i =1  To Len(str)
            sT = Mid(str, i, 1) 
            If sT = "%" Then 			
                If i+2 < Len(str) Then 
                    sR = sR & _ 
                        Chr(CLng("&H" & Mid(str, i+1, 2))) 						
                    i = i+2 
                End If 
            Else 
                sR = sR & sT 
            End If 
        Next 
        URLDecode = sR 
    End Function 

Response.CodePage = 65001
Response.CharSet = "utf-8"  
gv_AuthenticationResponse1 =Request.Form("AuthenticationResponse")

gv_AuthenticationResponse=Replace(gv_AuthenticationResponse1,"%3e",">")
xmlString  = URLDecode(gv_AuthenticationResponse)

'Response.Write xmlString

 Set XML=Server.CreateObject("Microsoft.XMLDOM")
 Set node=Server.CreateObject("Microsoft.XMLDOM")
 XML.async=False
 XML.LoadXML (xmlString) 
 
If XML.parseError.errorCode <> 0 Then
   Response.Write "<p>Parse Error Reason: " & XML.parseError.reason & "</p>"
Else

	Set node=XML.getElementsByTagName("VPosTransactionResponseContract")
	

					for each node1 in node(0).childNodes
					
						ResponseCode=node1.text
						elseif node1.nodeName="ResponseMessage" then 
						ResponseMessage=node1.text	
						elseif node1.nodeName="MerchantOrderId" then 
						MerchantOrderId=node1.text
						elseif node1.nodeName="OrderId"		 then 
						OrderId=node1.text
						elseif node1.nodeName="ProvisionNumber" then
						ProvisionNumber=node1.text
						elseif node1.nodeName="RRN" 			 then 
						RRN=node1.text
						elseif node1.nodeName="Stan" 			 then 
						Stan=node1.text
						elseif node1.nodeName="MD" 			 then 
						MD=node1.text
						elseif node1.nodeName="Amount" 		 then 
						Amount=node1.text	
						elseif node1.nodeName="HashData" 		 then HashData=node1.text													
						end if
					next
	end if
%>

<form action='http://localhost/KuveytTurk_Ornek_asp/4_OnayCevap.asp' method='post'>
    <div style="margin:0 auto">
        <p>Onay Ekrani</p>
        <h2>Ödeme Onayi</h2>
        <table>
            <tr colspan="3">
                <td>
                    Hata Kodu
                </td>
                <td>
		<input name="ResponseCode" id="ResponseCode" Type="text" value="<% Response.Write ResponseCode %>" />
 
                </td>
            </tr>
            <tr colspan="3">
                <td>
                    Açıklama
                </td>
                <td>
                    <input name="ResponseMessage" Type="text" value="<% Response.Write ResponseMessage %>" />
                </td>
            </tr>
            <tr colspan="3">
                <td>
                    Üye Siparis No
                </td>
                <td>
                    <input name="MerchantOrderId" Type="text" value="<% Response.Write MerchantOrderId %>" />
                </td>
            </tr>
            <tr colspan="3">
                <td>
                    SanalPos Siparis No
                </td>
                <td>
                    <input name="OrderId" Type="text"  value="<% Response.Write OrderId %>"/>
                </td>
            </tr>
            <tr colspan="3">
                <td>
                    Provizyon No
                </td>
                <td>
                    <input name="ProvisionNumber" Type="text" value="<% Response.Write ProvisionNumber %>"/> 
                </td>
            </tr>
            <tr colspan="3">
                <td>
                    RRN
                </td>
                <td>
                     <input name="RRN" Type="text" value="<% Response.Write RRN %>" /> 
                </td>
            </tr>
            <tr colspan="3">
                <td>
                    Stan
                </td>
                <td>
                     <input name="Stan" Type="text" value="<% Response.Write Stan  %>" /> 
                </td>
            </tr>
            <tr colspan="3">
                <td>
                    MD
                </td>
                <td>
                    <input name="MD" Type="text" value="<% Response.Write MD %>" /> 
                </td>
            </tr>
            <tr colspan="3">
                <td>
                    Islem Tutari
                </td>
                <td>
                     <input name="Amount" Type="text" value="<% Response.Write Amount %>" /> 
                </td>
            </tr>
            <tr colspan="3">
                <td>
                    HashData
                </td>
                <td>
                     <input name="HashData" Type="text" value="<% Response.Write HashData %>"/> 
                </td>
            </tr>
            <tr colspan="3">
                <td>
                    Dogrulama
                </td>
                <td>
                    
                </td>
            </tr>
            <tr colspan="3">
                <td>
                    <input id= "submit" type="submit" value="Onayla" />
                </td>
            </tr>
           </table>
    </div>
</form>

</body>
</html>