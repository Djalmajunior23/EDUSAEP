import { Simulado } from "../../modules/simulados/types";
import { FormProvider, FormCreationResult, FormResponse } from "./FormProvider";

import { triggerN8NRequest } from "../../services/n8nService";

export class N8nFormProvider implements FormProvider {
  private webhookUrl: string;

  constructor(webhookUrl: string) {
    this.webhookUrl = webhookUrl;
  }

  async createForm(simulado: Simulado, questions: any[]): Promise<FormCreationResult> {
    const data = await triggerN8NRequest({
      action: 'create_form',
      simulado: {
        id: simulado.id,
        title: simulado.title,
        description: simulado.description,
        startDate: simulado.startDate,
        endDate: simulado.endDate,
      },
      questions: questions.map(q => ({
        id: q.id,
        text: q.text,
        options: q.options,
        competency: q.competency,
      })),
    }, 'forms');

    return {
      externalFormId: data.externalFormId,
      publicUrl: data.publicUrl,
      adminUrl: data.adminUrl,
      integrationToken: data.integrationToken,
    };
  }

  async getResponses(formId: string, integrationToken: string): Promise<FormResponse[]> {
    const data = await triggerN8NRequest({
      action: 'get_responses',
      formId,
      integrationToken,
    }, 'forms');

    return data.responses.map((r: any) => ({
      ...r,
      submittedAt: new Date(r.submittedAt),
    }));
  }

  async closeForm(formId: string): Promise<void> {
    await triggerN8NRequest({
      action: 'close_form',
      formId,
    }, 'forms');
  }
}
