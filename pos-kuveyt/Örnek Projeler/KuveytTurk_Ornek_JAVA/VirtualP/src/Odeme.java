import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.net.ConnectException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLConnection;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

import Decoder.BASE64Encoder;


public class ThreeDMode {
	 protected static BASE64Encoder B64ENC = new BASE64Encoder(); 
	public static void main(String[] args) {
		// TODO Auto-generated method stub
		Payment();
		//SendApprove();
	}
	
	public void ThreeDPayment(){
		
		
	}
public static String Payment(){
		
	 String HashStringPss =Password //Api kullanıcı şifresi
	 String hashPassword=calculateHash(HashStringPss);
	 String HashString = MerchantId + MerchantOrderId +Amount +OkUrl + FailUrl +UserName + hashPassword;
	 String HashResult=calculateHash(HashString);
	 System.out.println("Post is started...");
	 String data= "<?xml version='1.0' encoding='ISO-8859-1'?>"
				  +"<KuveytTurkVPosMessage xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xsd='http://www.w3.org/2001/XMLSchema'>"
				  +"<APIVersion>TDV2.0.0</APIVersion>"
				  +"<OkUrl></OkUrl>" // Başarılı işlemlerin yönlendirileceği sayfa 
				  +"<FailUrl></FailUrl>" // Başarısız işlemlerin yönlendirileceği sayfa 
				  +"<HashData>"+HashResult+"</HashData>"
				  +"<MerchantId></MerchantId>" // mağaza no
				  +"<CustomerId></CustomerId>"//müşteri no
				  +"<UserName></UserName>" //api kullanıcı adı
				  +"<CardNumber></CardNumber>" // kart no
				  +"<CardExpireDateYear></CardExpireDateYear>"// kart son kullanım yılı
				  +"<CardExpireDateMonth></CardExpireDateMonth>" // kart son kullanım ayı
				  +"<CardCVV2></CardCVV2>" // CVV
				  +"<CardHolderName></CardHolderName>" // kart üzerinde yazan isim soyisim
				  +"<CardType>Troy</CardType>"
				  +"<TransactionType>Sale</TransactionType>"
				  +"<InstallmentCount>0</InstallmentCount>"
				  +"<Amount></Amount>" Tutar
				  +"<DisplayAmount>"+Amount+"</DisplayAmount>"
				  +"<CurrencyCode>0949</CurrencyCode>" 
				  +"<MerchantOrderId>Siparis_145</MerchantOrderId>"
				  +"<TransactionSecurity>3</TransactionSecurity>"
				  + "<DeviceData>"
				  + "<DeviceChannel>02</DeviceChannel>"
				  + "<ClientIP>12.12.12.145</ClientIP>"
				  + "</DeviceData>"
				  + "<CardHolderData>"
				  + "<BillAddrCity>İstanbul</BillAddrCity>"
				  + "<BillAddrCountry>792</BillAddrCountry>"
				  + "<BillAddrLine1>Test Mahallesi</BillAddrLine1>"
				  + "<BillAddrPostCode>34500</BillAddrPostCode>"
				  + "<BillAddrState>34</BillAddrState>"
				  + "<Email>test_test@test.com</Email>"
				  + "<MobilePhone>"
				  + "<Cc>90</Cc>"
				  + "<Subscriber>5555000000</Subscriber>"
				  + "</MobilePhone>"
				  + "</CardHolderData>" 
				  + "</KuveytTurkVPosMessage>";    
	
          System.setProperty("https.protocols", "SSLv3,TLSv1,TLSv1.1,TLSv1.2");                      
	  String url="https://sanalpos.kuveytturk.com.tr/ServiceGateWay/Home/ThreeDModelPayGate";	 
  	  String response= post(data,url);
  	  
	  if(response!=null)
		 {
	SendApprove();
		 }
		 else{
			System.out.println("full");
	 }
      
	  return response;
	
	}
	public static void SendApprove(){
				
	 String HashStringPss =Password //Api kullanıcı şifresi
	 String hashPassword=calculateHash(HashStringPss);
	 String HashString = MerchantId + MerchantOrderId +Amount  +UserName + hashPassword;
	 String HashResult=calculateHash(HashString);
				
		 String data="<?xml version='1.0' encoding='ISO-8859-1'?>"
				    +"<KuveytTurkVPosMessage xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xsd='http://www.w3.org/2001/XMLSchema'>"
				    +"<APIVersion>1.0.0</APIVersion>"				 
				    +"<HashData>"+HashResult+"</HashData>"	 
				    +"<MerchantId></MerchantId>"
				 	+"<CustomerId></CustomerId>"
				 	+"<UserName></UserName>"
				 	+"<TransactionType>Sale</TransactionType>"
				 	+"<InstallmentCount>0</InstallmentCount>"
				 	+"<Amount></Amount>"
				 	+"<MerchantOrderId></MerchantOrderId>"
				 	+"<TransactionSecurity>3</TransactionSecurity>"
				 	+"<KuveytTurkVPosAdditionalData>"
				 	+"<AdditionalData>"
					+"<Key>MD</Key>"
					+"<Data></Data>"	// Geri Dönüş ResponseMessage da yer alan MD değeri	
					+"</AdditionalData>"
					+"</KuveytTurkVPosAdditionalData>"
					+"</KuveytTurkVPosMessage>";
		
                 
                 System.setProperty("https.protocols", "SSLv3,TLSv1,TLSv1.1,TLSv1.2");
		 String url="https://sanalpos.kuveytturk.com.tr/ServiceGateWay/Home/ThreeDModelProvisionGate";
		
		 String response=post(data,url);
		 if(response!=null)
		 {
			System.out.println("fullSendApprove");
		 }
		 else{
			 System.out.println("emptySendApprove");
		 }
		 
	}
    public static String post(String data, String url){
        
    	try {
                    URL u = new URL(url);

                    URLConnection uc = u.openConnection();
                    HttpURLConnection connection = (HttpURLConnection) uc;
                    connection.setRequestProperty("Content-Type", "application/xml; charset=utf-8");
                    connection.setDoOutput(true);
                    connection.setDoInput(true);
                    connection.setRequestMethod("POST");
                    OutputStream out = connection.getOutputStream();
                    OutputStreamWriter wout = new OutputStreamWriter(out, "UTF-8");
                    wout.write(data);
                    wout.flush();
                    out.close();
                    InputStream in = connection.getInputStream();
                    String str = "";
                    int c;
                    while ((c = in.read()) != -1)
                    	
                                str += (char)c;
                    System.out.println("Res is: "+str);
                    in.close();
                    out.close();
                    connection.disconnect();
                    
                    return str;
        } catch (IOException e) {
                    System.err.println(e);
                    e.printStackTrace();
        }
    	
    	System.out.println();
        return null;
}
    public static String calculateHash(String hashdata) {
        String returnText = "";
        MessageDigest sha1 = null;
        try {
                        sha1 = MessageDigest.getInstance("SHA-1");
                        sha1.update(hashdata.getBytes());
                        returnText = B64ENC.encode(sha1.digest());
        } catch (NoSuchAlgorithmException e) {
                        e.printStackTrace();
        }
        return returnText;
}

	
}
