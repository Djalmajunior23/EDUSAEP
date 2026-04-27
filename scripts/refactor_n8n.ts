import fs from 'fs';
import path from 'path';

const WORKFLOWS_DIR = path.join(process.cwd(), 'n8n_workflows');

const logsColumns = {
  "mappingMode": "defineBelow",
  "value": {
    "ID_Workflow": "={{ $workflow.id }}",
    "Nome": "={{ $json.body && ($json.body.studentName || $json.body.professorName) || 'Sistema' }}",
    "Tipo_Acao": "={{ $node.name }}",
    "Data_Hora": "={{ new Date().toISOString() }}",
    "Status": "={{ $execution.error ? 'Erro' : 'Sucesso' }}",
    "Resultado_IA": "={{ $json.aiResult || '' }}",
    "Tempo_Execucao": "={{ $execution.duration || 0 }}"
  },
  "matchingColumns": [],
  "schemaMode": "auto"
};

const getLogNode = (id: string, x: number, y: number) => ({
  "parameters": {
    "operation": "append",
    "documentId": {
      "__rl": true,
      "value": "SEU_SHEET_ID_DE_LOGS",
      "mode": "id"
    },
    "sheetName": {
      "__rl": true,
      "value": "Logs_Atividades",
      "mode": "name"
    },
    "columns": logsColumns
  },
  "id": id,
  "name": "Gravar Logs no Google Sheets",
  "type": "n8n-nodes-base.googleSheets",
  "typeVersion": 4.1,
  "position": [x, y]
});

const files = fs.readdirSync(WORKFLOWS_DIR).filter(f => f.endsWith('.json'));

files.forEach(file => {
  const filePath = path.join(WORKFLOWS_DIR, file);
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    let hasLogNode = false;
    let logNodeId = "";
    
    // Replace nodes
    data.nodes = data.nodes.map((node: any) => {
      // Convert emailSend to gmail
      if (node.type === "n8n-nodes-base.emailSend" || node.type === "n8n-nodes-base.gmail") {
        node.type = "n8n-nodes-base.gmail";
        node.typeVersion = 2.1;
        if (!node.parameters) node.parameters = {};
        node.parameters.resource = "message";
        node.parameters.operation = "send";
        
        if (node.parameters.toEmail) {
          node.parameters.sendTo = node.parameters.toEmail;
          delete node.parameters.toEmail;
        }
        if (node.parameters.fromEmail) delete node.parameters.fromEmail;
      }
      
      // Keep track of existing sheet logs if we want to update them
      if (node.type === "n8n-nodes-base.googleSheets") {
        hasLogNode = true;
        logNodeId = node.id;
        node.parameters.operation = "append";
        if (node.parameters.columns) {
           node.parameters.columns = logsColumns;
        }
        // Force the sheet ID and name
        if (!node.parameters.documentId) {
            node.parameters.documentId = { "__rl": true, "value": "SEU_SHEET_ID_DE_LOGS", "mode": "id" };
        }
        if (!node.parameters.sheetName) {
            node.parameters.sheetName = { "__rl": true, "value": "Logs_Atividades", "mode": "name" };
        }
      }
      return node;
    });

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Refactored ${file}`);
  } catch(e) {
    console.error(`Error in ${file}:`, e);
  }
});
