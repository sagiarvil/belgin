<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="Fail.aspx.cs" Inherits="ThreeDMode.fail" %>

<!DOCTYPE html>

<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <title></title>
</head>
<body>
    <form id="form1" runat="server" action="SendApprove.aspx">
        <table width="400px">
            <tr>
                <td valign="top">

                    <table class="">

                        <tr>
                            <td>
                                <div></div>
                            </td>
                            <td>&nbsp;&nbsp; </td>
                            <td>&nbsp;&nbsp;&nbsp; </td>
                            <td>&nbsp;</td>
                        </tr>
                        <asp:Panel ID="Installment" runat="server" Visible="false">

                            <asp:Panel ID="pnlTaksit" runat="server">
                                <tr>
                                    <td>Taksit Sayısı</td>
                                    <td>
                                        <asp:DropDownList ID="InstallmentCount" runat="server">
                                            <asp:ListItem Value="1" Selected="True">1</asp:ListItem>
                                        </asp:DropDownList>
                                    </td>
                                </tr>
                            </asp:Panel>

                        </asp:Panel>

                        <tr>
                            <td>
                                <div>Cevap Kodu</div>
                            </td>
                            <td>&nbsp;</td>
                            <td>:</td>
                            <td>
                                <asp:TextBox ID="ResponseCode" runat="server"></asp:TextBox>&nbsp;</td>
                        </tr>
                        <tr>
                            <td>
                                <div>
                                    Açıklama
                                </div>
                            </td>
                            <td>&nbsp;</td>
                            <td>:</td>
                            <td>
                                <asp:TextBox ID="ResponseMessage" runat="server" MaxLength="19"></asp:TextBox></td>
                        </tr>
                        <tr>
                            <td>
                                <div>Üye Sipariş No</div>
                            </td>
                            <td>&nbsp;</td>
                            <td>:</td>
                            <td>
                                <asp:TextBox ID="MerchantOrderId" runat="server" MaxLength="19"></asp:TextBox></td>
                        </tr>
                        <tr>
                            <td>
                                <div>Sanal Pos Sipariş No</div>
                            </td>
                            <td>&nbsp;</td>
                            <td>:</td>
                            <td>
                                <asp:TextBox ID="OrderId" runat="server" MaxLength="19"></asp:TextBox></td>
                        </tr>
                        <tr>
                            <td>
                                <div>Provizyon No</div>
                            </td>
                            <td>&nbsp;</td>
                            <td>:</td>
                            <td>
                                <asp:TextBox ID="ProvisionNumber" runat="server" MaxLength="19"></asp:TextBox></td>
                        </tr>
                        <tr>
                            <td>
                                <div>RRN</div>
                            </td>
                            <td>&nbsp;</td>
                            <td>:</td>
                            <td>
                                <asp:TextBox ID="RRN" runat="server" MaxLength="19"></asp:TextBox></td>
                        </tr>
                        <tr>
                            <td>
                                <div>Stan</div>
                            </td>
                            <td>&nbsp;</td>
                            <td>:</td>
                            <td>
                                <asp:TextBox ID="Stan" runat="server" MaxLength="19"></asp:TextBox></td>
                        </tr>
                        <tr>
                            <td>
                                <div>MD</div>
                            </td>
                            <td>&nbsp;</td>
                            <td>:</td>
                            <td>
                                <asp:TextBox ID="MD" runat="server" MaxLength="19"></asp:TextBox></td>
                        </tr>
                        <tr>
                            <td>
                                <div>İşlem Tutarı</div>
                            </td>
                            <td>&nbsp;</td>
                            <td>:</td>
                            <td>
                                <asp:TextBox ID="Amount" runat="server" MaxLength="19"></asp:TextBox></td>
                        </tr>
                        <td>
                            <div>HashData</div>
                        </td>
                        <td>&nbsp;</td>
                        <td>:</td>
                        <td>
                            <asp:TextBox ID="HashData" runat="server" MaxLength="19"></asp:TextBox></td>
            </tr>


        </table>

    </form>

</body>
</html>
