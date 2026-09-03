<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1" />
<title></title>
</head>

<body>


<script language="javascript" type="text/javascript" runat="server">
var hexcase = 0;
var b64pad= "=";
var chrsz = 8;
function hex_sha1(s){return binb2hex(core_sha1(str2binb(s),s.length * chrsz));}
function b64_sha1(s){return binb2b64(core_sha1(str2binb(s),s.length * chrsz));}
function str_sha1(s){return binb2str(core_sha1(str2binb(s),s.length * chrsz));}
function hex_hmac_sha1(key, data){ return binb2hex(core_hmac_sha1(key, data));}
function b64_hmac_sha1(key, data){ return binb2b64(core_hmac_sha1(key, data));}
function str_hmac_sha1(key, data){ return binb2str(core_hmac_sha1(key, data));}
function sha1_vm_test()
{
return hex_sha1("abc") == "a9993e364706816aba3e25717850c26c9cd0d89d";
}
function core_sha1(x, len)
{
x[len >> 5] |= 0x80 << (24 - len % 32);
x[((len + 64 >> 9) << 4) + 15] = len;
var w = Array(80);
var a =1732584193;
var b = -271733879;
var c = -1732584194;
var d =271733878;
var e = -1009589776;
for(var i = 0; i < x.length; i += 16)
{
var olda = a;
var oldb = b;
var oldc = c;
var oldd = d;
var olde = e;
for(var j = 0; j < 80; j++)
{
if(j < 16) w[j] = x[i + j];
else w[j] = rol(w[j-3] ^ w[j-8] ^ w[j-14] ^ w[j-16], 1);
var t = safe_add(safe_add(rol(a, 5), sha1_ft(j, b, c, d)),
 safe_add(safe_add(e, w[j]), sha1_kt(j)));
e = d;
d = c;
c = rol(b, 30);
b = a;
a = t;
}
a = safe_add(a, olda);
b = safe_add(b, oldb);
c = safe_add(c, oldc);
d = safe_add(d, oldd);
e = safe_add(e, olde);
}
return Array(a, b, c, d, e);
}
function sha1_ft(t, b, c, d)
{
if(t < 20) return (b & c) | ((~b) & d);
if(t < 40) return b ^ c ^ d;
if(t < 60) return (b & c) | (b & d) | (c & d);
return b ^ c ^ d;
}
function sha1_kt(t)
{
return (t < 20) ?1518500249 : (t < 40) ?1859775393 :
(t < 60) ? -1894007588 : -899497514;
}
function core_hmac_sha1(key, data)
{
var bkey = str2binb(key);
if(bkey.length > 16) bkey = core_sha1(bkey, key.length * chrsz);
var ipad = Array(16), opad = Array(16);
for(var i = 0; i < 16; i++)
{
ipad[i] = bkey[i] ^ 0x36363636;
opad[i] = bkey[i] ^ 0x5C5C5C5C;
}
var hash = core_sha1(ipad.concat(str2binb(data)), 512 + data.length * chrsz);
return core_sha1(opad.concat(hash), 512 + 160);
}
function safe_add(x, y)
{
var lsw = (x & 0xFFFF) + (y & 0xFFFF);
var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
return (msw << 16) | (lsw & 0xFFFF);
}
function rol(num, cnt)
{
return (num << cnt) | (num >>> (32 - cnt));
}
function str2binb(str)
{
var bin = Array();
var mask = (1 << chrsz) - 1;
for(var i = 0; i < str.length * chrsz; i += chrsz)
bin[i>>5] |= (str.charCodeAt(i / chrsz) & mask) << (32 - chrsz - i%32);
return bin;
}
function binb2str(bin)
{
var str = "";
var mask = (1 << chrsz) - 1;
for(var i = 0; i < bin.length * 32; i += chrsz)
str += String.fromCharCode((bin[i>>5] >>> (32 - chrsz - i%32)) & mask);
return str;
}
function binb2hex(binarray)
{
var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
var str = "";
for(var i = 0; i < binarray.length * 4; i++)
{
str += hex_tab.charAt((binarray[i>>2] >> ((3 - i%4)*8+4)) & 0xF) +
 hex_tab.charAt((binarray[i>>2] >> ((3 - i%4)*8)) & 0xF);
}
return str;
}
function binb2b64(binarray)
{
var tab = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var str = "";
for(var i = 0; i < binarray.length * 4; i += 3)
{
var triplet = (((binarray[i >> 2] >> 8 * (3 -i %4)) & 0xFF) << 16)
| (((binarray[i+1 >> 2] >> 8 * (3 - (i+1)%4)) & 0xFF) << 8 )
|((binarray[i+2 >> 2] >> 8 * (3 - (i+2)%4)) & 0xFF);
for(var j = 0; j < 4; j++)
{
if(i * 8 + j * 6 > binarray.length * 32) str += b64pad;
else str += tab.charAt((triplet >> 6*(3-j)) & 0x3F);
}
}
return str;
}
</script>


<%

	CardName=request.form("CardHolderName")
	CardNumber=request.form("CardNumber")
	CardExpireDateMonth=request.form("CardExpireDateMonth")
	CardExpireDateYear=request.form("CardExpireDateYear")
	CardCVV2=request.form("CardCVV2")
    Amount=request.form("Tutar")' Islem Tutari
    MerchantOrderId = "Siparis_16012019"'Siparis Numarasi
    CustomerId = "" 'Müsteri Numarasi
    MerchantId = "" ' Magaza Kodu
    OkUrl= "http://localhost/KuveytTurk_Ornek_asp/3_OdemeOnay.asp" ' Basarili sonuç alinirsa, yönledirelecek sayfa
	FailUrl  = "http://localhost/KuveytTurk_Ornek_asp/HataSayfasi.asp" 'Basarisiz sonuç alinirsa, yönledirelecek sayfa
    UserName="" 'Web Yönetim ekranalrindan olusturulan api rollü kullanici
	Password="" 'Web Yönetim ekranalrindan olusturulan api rollü kullanici sifresi
	HashedPassword = b64_sha1(Password)
    HashData = b64_sha1(MerchantId&MerchantOrderId&Amount&OkUrl&FailUrl&UserName&HashedPassword)
		

gServer = "https://sanalpos.kuveytturk.com.tr/ServiceGateWay/Home/ThreeDModelPayGate" 

postdata = "<KuveytTurkVPosMessage xmlns:xsi=""http://www.w3.org/2001/XMLSchema-instance"" xmlns:xsd=""http://www.w3.org/2001/XMLSchema"">"
				postdata = postdata & "<APIVersion>TDV2.0.0</APIVersion>"
				postdata = postdata & "<OkUrl>"&OkUrl&"</OkUrl>"
				postdata = postdata & "<FailUrl>"&FailUrl&"</FailUrl>"
				postdata = postdata & "<HashData>"&HashData&"</HashData>"
				postdata = postdata & "<MerchantId>"&MerchantId&"</MerchantId>"
				postdata = postdata & "<CustomerId>"&CustomerId&"</CustomerId>"
				postdata = postdata & "<UserName>"&UserName&"</UserName>"
				postdata = postdata & "<CardNumber>"&CardNumber&"</CardNumber>"
				postdata = postdata & "<CardExpireDateYear>"&CardExpireDateYear&"</CardExpireDateYear>"
				postdata = postdata & "<CardExpireDateMonth>"&CardExpireDateMonth&"</CardExpireDateMonth>"
				postdata = postdata & "<CardCVV2>"&CardCVV2&"</CardCVV2>"
				postdata = postdata & "<CardHolderName>"&CardName&"</CardHolderName>"
				postdata = postdata & "<CardType>Troy</CardType>"
				postdata = postdata & "<BatchID>0</BatchID>"
				postdata = postdata & "<TransactionType>Sale</TransactionType>"
				postdata = postdata & "<InstallmentCount>0</InstallmentCount>"
				postdata = postdata & "<Amount>"&Amount&"</Amount>"
				postdata = postdata & "<DisplayAmount>"&Amount&"</DisplayAmount>"
				postdata = postdata & "<CurrencyCode>0949</CurrencyCode>"
				postdata = postdata & "<MerchantOrderId>"&MerchantOrderId&"</MerchantOrderId>"
				postdata = postdata & "<TransactionSecurity>3</TransactionSecurity>"
				postdata = postdata + "<DeviceData>";
				postdata = postdata + "<DeviceChannel>02</DeviceChannel>";
				postdata = postdata + "<ClientIP>12.12.12.14</ClientIP>";
				postdata = postdata + "</DeviceData>";
				postdata = postdata + "<CardHolderData>";
				postdata = postdata + "<BillAddrCity>Ýstanbul</BillAddrCity>";
				postdata = postdata + "<BillAddrCountry>792</BillAddrCountry>";
				postdata = postdata + "<BillAddrLine1>Test Mahallesi</BillAddrLine1>";
				postdata = postdata + "<BillAddrPostCode>34500</BillAddrPostCode>";
				postdata = postdata + "<BillAddrState>34</BillAddrState>";
				postdata = postdata + "<Email>test_test@test.com</Email>";
				postdata = postdata + "<MobilePhone>";
				postdata = postdata + "<Cc>90</Cc>";
				postdata = postdata + "<Subscriber>5005000000</Subscriber>";
				postdata = postdata + "</MobilePhone>";
				postdata = postdata + "</CardHolderData>";				
				postdata = postdata & "</KuveytTurkVPosMessage>"

Set Xobj = Server.CreateObject("Msxml2.XMLHTTP") 
	Xobj.option (9) = 2720 'For TLS 1.2 Support
    Xobj.Open "POST",gServer,false 
    Xobj.Send postData 
    result = Xobj.Responsetext  

    response.write "Gelen Cevap :" & result
	
    response.end

    'Set Xobj  = Nothing



		
		%>

</body>
</html>
