export const validateEntity = (entity: any, requiredFields: string[]) => {
  for (const field of requiredFields) {
    if (entity[field] === undefined || entity[field] === null) {
      throw new Error(`Validação Falhou: O campo ${field} é obrigatório.`);
    }
  }
};
