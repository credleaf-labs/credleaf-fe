describe("CredLeaf credential console", () => {
  it("shows credential lifecycle metrics", () => {
    cy.visit("/");
    cy.contains("CredLeaf credential lifecycle console").should("be.visible");
    cy.contains("Credential status").should("be.visible");
    cy.contains("ACTIVE").should("be.visible");
  });
});
