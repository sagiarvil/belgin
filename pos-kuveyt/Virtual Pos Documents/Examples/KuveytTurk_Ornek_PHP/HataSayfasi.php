<?php
$AuthenticationResponse=$_POST["AuthenticationResponse"];
$RequestContent = urldecode($AuthenticationResponse);

$xxml=simplexml_load_string($RequestContent) or die("Error: Cannot create object");
print_r($xxml);

?>
<form>
    <div style="margin:0 auto">
           <table>
            <tr colspan="3">
                <td>
                    Hata Kodu
                </td>
                <td>
		<input name="ResponseCode" Type="text" value= <?php  echo $xxml->ResponseCode ?> />
 
                </td>
            </tr>
            <tr colspan="3">
                <td>
                    Açýklama
                </td>
                <td>
                    <input name="ResponseMessage" Type="text" value=<?php echo $xxml->ResponseMessage ?> />
                </td>
            </tr>
            <tr colspan="3">
                <td>
                    Üye Siparis No
                </td>
                <td>
                    <input name="MerchantOrderId" Type="text" value=<?php echo $xxml->VPosMessage->MerchantOrderId  ?> />
                </td>
            </tr>
            <tr colspan="3">
                <td>
                    SanalPos Siparis No
                </td>
                <td>
                    <input name="OrderId" Type="text"  value=<?php echo $xxml->VPosMessage->OrderId ?> />
                </td>
            </tr>
            <tr colspan="3">
                <td>
                    Provizyon No
                </td>
                <td>
                    <input name="ProvisionNumber" Type="text" value=<?php echo $xxml->VPosMessage->ProvisionNumber ?> /> 
                </td>
            </tr>
            <tr colspan="3">
                <td>
                    RRN
                </td>
                <td>
                     <input name="RRN" Type="text" value=<?php echo $xxml->VPosMessage->RRN ?> /> 
                </td>
            </tr>
            <tr colspan="3">
                <td>
                    Stan
                </td>
                <td>
                     <input name="Stan" Type="text" value=<?php echo $xxml->VPosMessage->Stan ?> /> 
                </td>
            </tr>
            <tr colspan="3">
                <td>
                    MD
                </td>
                <td>
                    <input name="MD" Type="text" value=<?php echo $xxml->MD ?> /> 
                </td>
            </tr>
            <tr colspan="3">
                <td>
                    Islem Tutari
                </td>
                <td>
                     <input name="Amount" Type="text" value=<?php echo $xxml->VPosMessage->Amount ?> /> 
                </td>
            </tr>
            <tr colspan="3">
                <td>
                    HashData
                </td>
                <td>
                     <input name="HashData" Type="text" value=<?php echo $xxml->VPosMessage->HashData ?>/> 
                </td>
            </tr>
            <tr colspan="3">
                <td>
                    Dogrulama
                </td>
                <td>
                    
                </td>
            </tr>
  
        </table>
    </div>
</form>