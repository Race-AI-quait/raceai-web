export const sendVerificationEmail = async (email: string, code: string): Promise<boolean> => {
  try {
    // ---------------------------------------------------------
    // CURRENT: MOCK
    // ---------------------------------------------------------
    console.log("==================================================");
    console.log(`📧 [MOCK EMAIL SERVICE]`);
    console.log(`To: ${email}`);
    console.log(`Subject: Verify your email / Invite`);
    console.log(`Body: ${code}`); // Can be code or link content
    console.log("==================================================");

    return true;
  } catch (error) {
    console.error("Email Service Error:", error);
    return false;
  }
};
