describe("CredLeaf credential console", () => {
  it("shows credential lifecycle metrics", () => {
    cy.visit("/");
    cy.contains("CredLeaf credential lifecycle console").should("be.visible");
    cy.contains("Credential status").should("be.visible");
    cy.contains("ACTIVE").should("be.visible");
  });

  it("runs issue, verify, revoke, and reverify flow from the console", () => {
    const credentials = [
      {
        id: "vc-1001",
        subject: "AI Commerce 수료증",
        issuer: "CredLeaf Demo Issuer",
        status: "ACTIVE",
        expiresAt: "2027-12-31",
        verificationCount: 128,
      },
    ];

    cy.intercept("GET", "**/api/credentials", credentials).as("listCredentials");
    cy.intercept("POST", "**/api/credentials", {
      id: "vc-1002",
      subject: "검증 자동화 증명 2",
      issuer: "CredLeaf Demo Issuer",
      status: "ACTIVE",
      expiresAt: "2027-07-09",
      verificationCount: 0,
    }).as("issueCredential");
    cy.intercept("GET", "**/api/credentials/vc-1002/verify", {
      credentialId: "vc-1002",
      valid: true,
      status: "ACTIVE",
      metrics: { verificationCount: 1 },
    }).as("verifyCredential");
    cy.intercept("PATCH", "**/api/credentials/vc-1002/revoke", {
      id: "vc-1002",
      subject: "검증 자동화 증명 2",
      issuer: "CredLeaf Demo Issuer",
      status: "REVOKED",
      expiresAt: "2027-07-09",
      verificationCount: 1,
    }).as("revokeCredential");

    cy.visit("/");
    cy.wait("@listCredentials");
    cy.contains("button", "Issue").click();
    cy.wait("@issueCredential");
    cy.contains("검증 자동화 증명 2").should("be.visible");
    cy.contains("button", "Verify").click();
    cy.wait("@verifyCredential");
    cy.contains("Verification result").should("be.visible");
    cy.contains("valid").should("be.visible");
    cy.contains("button", "Revoke").click();
    cy.wait("@revokeCredential");
    cy.contains("REVOKED").should("be.visible");
  });
});
