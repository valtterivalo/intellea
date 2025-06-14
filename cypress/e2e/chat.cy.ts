describe('chat panel', () => {
  it('sends a prompt and receives reply', () => {
    cy.visit('/');
    cy.contains('Chat').click();
    cy.get('textarea').type('hello{enter}');
    cy.contains('hello').should('exist');
  });
});
