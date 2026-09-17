const { EarsivPortalService } = require('./earsiv-service');
const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'carbon-web-1265b' });

async function run() {
  const earsiv = new EarsivPortalService();
  try {
    const authData = await earsiv.login();
    console.log("Logged in!", authData.token);
    
    // Get drafts
    const drafts = await earsiv.getDraftInvoices(authData.token, { cookie: authData.cookie });
    console.log("Drafts found:", drafts.length);
    
    if (drafts.length > 0) {
      const latest = drafts[drafts.length - 1]; // or [0] depending on sorting
      console.log("Latest Draft:", latest);
      
      const uuid = latest.faturaUuid || latest.ettn || latest.invoiceUuid;
      console.log("Signing UUID:", uuid);
      
      const signRes = await earsiv.verifySmsAndSign(authData.token, 'H6D7FZ', [uuid], 'MANUAL', { cookie: authData.cookie });
      console.log("Sign result:", signRes);
    } else {
      console.log("No drafts found!");
    }
    
    await earsiv.logout(authData.token, authData.cookie);
  } catch (err) {
    console.error("Error:", err);
  }
}

run().then(() => process.exit(0)).catch(() => process.exit(1));
