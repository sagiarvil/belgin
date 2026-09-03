using System;
using System.IO;
using System.Net;
using System.Security.Cryptography;
using System.Text;

namespace ThreeDMode
{
    public partial class SendApprove : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            string MerchantOrderId = Request.Form["MerchantOrderId"];
            string Amount = Request.Form["Amount"];
            string MD = Request.Form["MD"];
            string CustomerId = ""; //Müsteri Numarasi
            string MerchantId = ""; //Magaza Kodu
            string UserName = ""; //  api rollü kullanici
            string Password = "";//  api rollü kullanici sifresi
            SHA1 sha = new SHA1CryptoServiceProvider();
            string HashedPassword = Convert.ToBase64String(sha.ComputeHash(Encoding.UTF8.GetBytes(Password)));
            string hashstr = MerchantId + MerchantOrderId + Amount.ToString() + UserName + HashedPassword;
            byte[] hashbytes = System.Text.Encoding.GetEncoding("ISO-8859-9").GetBytes(hashstr);
            byte[] inputbytes = sha.ComputeHash(hashbytes);
            String hash = Convert.ToBase64String(inputbytes);
            string HashData = hash;
            string gServer = "https://sanalpos.kuveytturk.com.tr/ServiceGateWay/Home/ThreeDModelProvisionGate";
            
            string postdata = "<KuveytTurkVPosMessage xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xsd='http://www.w3.org/2001/XMLSchema'>";
            postdata = postdata + "<APIVersion>1.0.0</APIVersion>";
            postdata = postdata + "<HashData>" + HashData + "</HashData>";
            postdata = postdata + "<MerchantId>" + MerchantId + "</MerchantId>";
            postdata = postdata + "<CustomerId>" + CustomerId + "</CustomerId>";
            postdata = postdata + "<UserName>" + UserName + "</UserName>";
			postdata = postdata + "<CurrencyCode>0949</CurrencyCode>";
            postdata = postdata + "<TransactionType>Sale</TransactionType>";
            postdata = postdata + "<InstallmentCount>0</InstallmentCount>";
            postdata = postdata + "<Amount>" + Amount + "</Amount>";
            postdata = postdata + "<MerchantOrderId>" + MerchantOrderId + "</MerchantOrderId>";
            postdata = postdata + "<TransactionSecurity>3</TransactionSecurity>";
            postdata = postdata + "<KuveytTurkVPosAdditionalData>";
            postdata = postdata + "<AdditionalData>";
            postdata = postdata + "<Key>MD</Key>";
            postdata = postdata + "<Data>" + MD + "</Data>";
            postdata = postdata + "</AdditionalData>";
            postdata = postdata + "</KuveytTurkVPosAdditionalData>";
            postdata = postdata + "</KuveytTurkVPosMessage>";

            ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls11 | SecurityProtocolType.Tls12;

            byte[] buffer = Encoding.UTF8.GetBytes(postdata);   
            HttpWebRequest WebReq = (HttpWebRequest)WebRequest.Create(gServer);
            WebReq.Timeout = 5 * 60 * 1000;

            WebReq.Method = "POST";
            WebReq.ContentType = "application/xml";
            WebReq.ContentLength = buffer.Length;

            WebReq.CookieContainer = new CookieContainer();
            Stream ReqStream = WebReq.GetRequestStream();
            ReqStream.Write(buffer, 0, buffer.Length);

            ReqStream.Close();

            WebResponse WebRes = WebReq.GetResponse();
            Stream ResStream = WebRes.GetResponseStream();
            StreamReader ResReader = new StreamReader(ResStream);
            string responseString = ResReader.ReadToEnd();


            Response.Write(responseString);

        }
    }
}