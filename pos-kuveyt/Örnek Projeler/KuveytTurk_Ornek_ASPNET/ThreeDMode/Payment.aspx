<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="Payment.aspx.cs" Inherits="ThreeDMode.Virtualpos" %>


<!DOCTYPE html>

<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <title></title>
    <meta http-equiv='Content-Type' content='text/html; charset=utf-8'>
    <style type="text/css">
        .auto-style1 {
            width: 100%;
        }

        .auto-style2 {
            text-align: center;
        }

        .UyeKayitKutu {
        }
    </style>
</head>
<body>
    <form id="form1" runat="server">
        <div class="FormGovde">
            <asp:Panel ID="Error" runat="server" Visible="false">
                <div>
                    <asp:Label ID="lblError" runat="server" Text="Label"></asp:Label>
                </div>
            </asp:Panel>
            <table class="auto-style1" align="center">
                <tr>
                    <asp:Panel ID="Payment" runat="server">
                    </asp:Panel>
                    <td valign="top">
                        <table width="400px">
                            <tr>
                                <td valign="top">

                                    <table class="">
                                        <tr>
                                            <td colspan="4">
                                                <div>Ödeme Bilgileri</div>
                                            </td>
                                        </tr>
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
                                                <div class="UyeKayitBaslik">Kart SAhibi Ad Soyad</div>
                                            </td>
                                            <td>&nbsp;</td>
                                            <td>:</td>
                                            <td>
                                                <asp:TextBox ID="CardHolderName" runat="server"></asp:TextBox>&nbsp;*</td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <div>Kredi Kartı No</div>
                                            </td>
                                            <td>&nbsp;</td>
                                            <td>:</td>
                                            <td>
                                                <asp:TextBox ID="CardNumber" runat="server" MaxLength="19"></asp:TextBox></td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <div class="UyeKayitBaslik">Son Kullanma Tarihi</div>
                                            </td>
                                            <td>&nbsp;</td>
                                            <td>:</td>
                                            <td>
                                                <asp:DropDownList ID="CardExpireDateMonth" runat="server">
                                                    <asp:ListItem>01</asp:ListItem>
                                                    <asp:ListItem>02</asp:ListItem>
                                                    <asp:ListItem>03</asp:ListItem>
                                                    <asp:ListItem>04</asp:ListItem>
                                                    <asp:ListItem>05</asp:ListItem>
                                                    <asp:ListItem>06</asp:ListItem>
                                                    <asp:ListItem>07</asp:ListItem>
                                                    <asp:ListItem>08</asp:ListItem>
                                                    <asp:ListItem>09</asp:ListItem>
                                                    <asp:ListItem>10</asp:ListItem>
                                                    <asp:ListItem>11</asp:ListItem>
                                                    <asp:ListItem>12</asp:ListItem>
                                                </asp:DropDownList>

                                                <asp:DropDownList ID="CardExpireDateYear" runat="server">
                                                    <asp:ListItem>17</asp:ListItem>
                                                    <asp:ListItem>18</asp:ListItem>

                                                </asp:DropDownList>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <div>CVV Kodu</div>
                                            </td>
                                            <td>&nbsp;</td>
                                            <td>:</td>
                                            <td>
                                                <asp:TextBox runat="server" ID="CardCVV2" MaxLength="3" Width="50px">988</asp:TextBox>&nbsp;</td>
                                        </tr>
                                        <tr>
                                            <td>Açıklama</td>
                                            <td>&nbsp;</td>
                                            <td>:</td>
                                            <td>
                                                <asp:TextBox ID="Description" runat="server" Width="250px" Height="60px"></asp:TextBox>

                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Tutar:</td>
                                            <td>&nbsp;</td>
                                            <td>:</td>
                                            <td>

                                                <asp:TextBox ID="TotalAmount" runat="server" Width="70px"></asp:TextBox>
                                                TL
                                            </td>
                                        </tr>


                                        <tr>

                                            <td>
                                                <br />
                                                <asp:Button ID="btnGonder" runat="server" class="button green large" Text="TAMAM" OnClick="btnGonder_Click" />

                                            </td>
                                        </tr>
                                    </table>



                                </td>
                            </tr>
                        </table>
                    </td>

                </tr>
            </table>

        </div>
    </form>
</body>
</html>
