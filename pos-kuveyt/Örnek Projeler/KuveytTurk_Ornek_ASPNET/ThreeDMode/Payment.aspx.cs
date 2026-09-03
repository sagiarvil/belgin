using System;
using System.IO;
using System.Net;
using System.Security.Cryptography;
using System.Text;

namespace ThreeDMode
{
    public partial class Virtualpos : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {

            Description.Text = "Kuveytturk Sanal Pos Entegrasyon";
            CardHolderName.Text = "";
            CardNumber.Text = "";
            CardCVV2.Text = "";
            CardExpireDateMonth.Text = "";
            CardExpireDateYear.Text = "";
            TotalAmount.Text = (100).ToString();


        }
        protected void btnGonder_Click(object sender, EventArgs e)
        {


            Decimal Amount = Convert.ToDecimal(TotalAmount.Text);//1.00TL için 100 girilmelidir.

            string CardHolderName = this.CardHolderName.Text;
            string CardNumber = this.CardNumber.Text;
            string CardExpireDateMonth = this.CardExpireDateMonth.Text;
            string CardExpireDateYear = this.CardExpireDateYear.Text;
            string CardCVV2 = this.CardCVV2.Text;
            string MerchantOrderId = "";
            string CustomerId = ""; //Müsteri Numarasi
            string MerchantId = ""; //Magaza Kodu
            string OkUrl = "http://localhost/KuveytTurk_Ornek_ASPNET/Approval.aspx"; //Basarili sonuç alinirsa, yönledirelecek sayfa
            string FailUrl = "http://localhost/KuveytTurk_Ornek_ASPNET/Fail.aspx"; //Basarisiz sonuç alinirsa, yönledirelecek sayfa
            string UserName = ""; //  api rollü kullanici adı
            string Password = "";//  api rollü kullanici sifresi
            SHA1 sha = new SHA1CryptoServiceProvider();
            string HashedPassword = Convert.ToBase64String(sha.ComputeHash(Encoding.UTF8.GetBytes(Password)));
            string hashstr = MerchantId + MerchantOrderId + Amount.ToString() + OkUrl + FailUrl + UserName + HashedPassword;
            byte[] hashbytes = System.Text.Encoding.GetEncoding("ISO-8859-9").GetBytes(hashstr);
            byte[] inputbytes = sha.ComputeHash(hashbytes);
            string hash = Convert.ToBase64String(inputbytes);
            string HashData = hash;

            string gServer = "https://sanalpos.kuveytturk.com.tr/ServiceGateWay/Home/ThreeDModelPayGate";

            string
            postdata = "<KuveytTurkVPosMessage xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xmlns:xsd='http://www.w3.org/2001/XMLSchema'>";
            postdata = postdata + "<APIVersion>TDV2.0.0</APIVersion>";
            postdata = postdata + "<OkUrl>" + OkUrl + "</OkUrl>";
            postdata = postdata + "<FailUrl>" + FailUrl + "</FailUrl>";
            postdata = postdata + "<HashData>" + HashData + "</HashData>";
            postdata = postdata + "<MerchantId>" + MerchantId + "</MerchantId>";
            postdata = postdata + "<CustomerId>" + CustomerId + "</CustomerId>";
            postdata = postdata + "<UserName>" + UserName + "</UserName>";
            postdata = postdata + "<CardNumber>" + CardNumber + "</CardNumber>";
            postdata = postdata + "<CardExpireDateYear>" + CardExpireDateYear + "</CardExpireDateYear>";
            postdata = postdata + "<CardExpireDateMonth>" + CardExpireDateMonth + "</CardExpireDateMonth>";
            postdata = postdata + "<CardCVV2>" + CardCVV2 + "</CardCVV2>";
            postdata = postdata + "<CardHolderName>" + CardHolderName + "</CardHolderName>";
            postdata = postdata + "<CardType>Troy</CardType>";
            postdata = postdata + "<BatchID>0</BatchID>";
            postdata = postdata + "<TransactionType>Sale</TransactionType>";
            postdata = postdata + "<InstallmentCount>0</InstallmentCount>";
            postdata = postdata + "<Amount>" + Amount + "</Amount>";
            postdata = postdata + "<DisplayAmount>" + Amount + "</DisplayAmount>";
            postdata = postdata + "<CurrencyCode>0949</CurrencyCode>";
            postdata = postdata + "<MerchantOrderId>" + MerchantOrderId + "</MerchantOrderId>";
            postdata = postdata + "<TransactionSecurity>3</TransactionSecurity>";
			postdata = postdata + "<DeviceData>";
            postdata = postdata + "<DeviceChannel>02</DeviceChannel>";
            postdata = postdata + "<ClientIP>12.12.12.145</ClientIP>";
            postdata = postdata + "</DeviceData>";
            postdata = postdata + "<CardHolderData>";
            postdata = postdata + "<BillAddrCity>İstanbul</BillAddrCity>";
            postdata = postdata + "<BillAddrCountry>792</BillAddrCountry>";
			postdata = postdata + "<BillAddrLine1>Test Mahallesi</BillAddrLine1>";
			postdata = postdata + "<BillAddrPostCode>34500</BillAddrPostCode>";
			postdata = postdata + "<BillAddrState>34</BillAddrState>";
			postdata = postdata + "<Email>test_test@test.com</Email>";
			postdata = postdata + "<MobilePhone>";
            postdata = postdata + "<Cc>90</Cc>";
            postdata = postdata + "<Subscriber>5555000000</Subscriber>";
            postdata = postdata + "</MobilePhone>";
            postdata = postdata + "</CardHolderData>";
            postdata = postdata + "</KuveytTurkVPosMessage>";

            //  ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls11 | SecurityProtocolType.Tls12;

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
    public class VPosTransactionResponseContract
    {

        public string ACSURL { get; set; }
        public string AuthenticationPacket { get; set; }
        public string HashData { get; set; }
        public bool IsEnrolled { get; set; }
        public bool IsSuccess { get; }
        public bool IsVirtual { get; set; }
        public string MD { get; set; }
        public string MerchantOrderId { get; set; }
        public int OrderId { get; set; }
        public string PareqHtmlFormString { get; set; }
        public string Password { get; set; }
        public string ProvisionNumber { get; set; }
        public string ResponseCode { get; set; }
        public string ResponseMessage { get; set; }
        public string RRN { get; set; }
        public string SafeKey { get; set; }
        public string Stan { get; set; }
        public DateTime TransactionTime { get; set; }
        public string TransactionType { get; set; }
        public KuveytTurkVPosMessage VPosMessage { get; set; }

    }
    public class KuveytTurkVPosMessage
    {
        public decimal Amount { get; set; }
    }
}