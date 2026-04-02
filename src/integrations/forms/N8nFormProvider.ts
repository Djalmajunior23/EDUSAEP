import { Simulado } from "../../modules/simulados/types";
import { FormProvider, FormCreationResult, FormResponse } from "./FormProvider";

export class N8nFormProvider implements FormProvider {
  private webhookUrl: string;

  constructor(webhookUrl: string) {
    this.webhookUrl = webhookUrl;
  }

  async createForm(simulado: Simulado, questions: any[]): Promise<FormCreationResult> {
    const response = await fetch(this.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create form via n8n');
    }

    const data = await response.json();
    return {
      externalFormId: data.externalFormId,
      publicUrl: data.publicUrl,
      adminUrl: data.adminUrl,
      integrationToken: data.integrationToken,
    };
  }

  async getResponses(formId: string, integrationToken: string): Promise<FormResponse[]> {
    const response = await fetch(this.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'get_responses',
        formId,
        integrationToken,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch responses from n8n');
    }

    const data = await response.json();
    return data.responses.map((r: any) => ({
      ...r,
      submittedAt: new Date(r.submittedAt),
    }));
  }

  async closeForm(formId: string): Promise<void> {
    const response = await fetch(this.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'close_form',
        formId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to close form via n8n');
    }
  }
}
