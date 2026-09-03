using System;
using System.IO;
using System.Xml.Serialization;

namespace ThreeDMode
{
    public partial class fail : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            string response1 = Request.Form["AuthenticationResponse"];
            string resp = System.Web.HttpContext.Current.Server.UrlDecode(response1);
            var x = new XmlSerializer(typeof(VPosTransactionResponseContract));
            var model = new VPosTransactionResponseContract();
            using (var ms = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(resp)))
            {
                model = x.Deserialize(ms) as VPosTransactionResponseContract;
            }

            ResponseCode.Text = model.ResponseCode;
            ResponseMessage.Text = model.ResponseMessage;
            MerchantOrderId.Text = model.MerchantOrderId;
            OrderId.Text = model.OrderId.ToString();
            ProvisionNumber.Text = model.ProvisionNumber;
            RRN.Text = model.RRN;
            Stan.Text = model.Stan;
            MD.Text = model.MD;
            HashData.Text = model.HashData;
        }
    }
}