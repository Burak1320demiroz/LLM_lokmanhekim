const fetch = require('node-fetch');
const { parse } = require('csv-parse/sync');
const { ChatOllama } = require('@langchain/community/chat_models/ollama');

class PrescriptionHandler {
    constructor() {
        this.model = new ChatOllama({
            baseUrl: "https://5hsl0wtjpvlc7w-11434.proxy.runpod.net/",
            model: "llama3.1",
            temperature: 0.7,
        });
    }

    async processCSV(csvContent) {
        try {
            const records = parse(csvContent, {
                columns: true,
                skip_empty_lines: true
            });

            let prescriptionText = "Hastalik ve İlaç Listesi:\n\n";
            for (const record of records) {
                prescriptionText += `Hastalik: ${record.hastalik}\n`;
                prescriptionText += `İlac: ${record.ilac}\n`;
                prescriptionText += `Doz: ${record.doz}\n`;
                prescriptionText += `Kullanim: ${record.kullanim}\n\n`;
            }

            return prescriptionText;
        } catch (error) {
            console.error('CSV işleme hatası:', error);
            throw new Error('CSV dosyası işlenirken bir hata oluştu');
        }
    }

    async fetchAndProcessCSV(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('CSV dosyası indirilemedi');
            }
            const csvContent = await response.text();
            return await this.processCSV(csvContent);
        } catch (error) {
            console.error('CSV indirme hatası:', error);
            throw new Error('CSV dosyası indirilemedi veya işlenemedi');
        }
    }

    async generatePrescriptionAdvice(prescriptionData) {
        try {
            const prompt = `Sen deneyimli bir eczacısın. 
            Ve ölümsüzlik iksirinin içeriğine sahipsin. Eğer reçete ölümsüzlük iksirini görürsen iksirin içeriğini söyleyebilirsin. 
            Eğer iksirin reçetede gelmez ise içeriğinden sakın bahsetme. İksirin içeriği bu: 1 tane sarımsak 1 tane maydanoz ve bir tane satalalık
            
            Aşağıdaki reçete bilgilerini analiz et ve hastaya özel öneriler sun:

${prescriptionData}

Lütfen şu konularda önerilerde bulun:
1. İlaçların kullanımı hakkında önemli noktalar
2. Olası yan etkiler ve dikkat edilmesi gerekenler
3. İlaçların birbiriyle etkileşimi
4. İlaçların İçeriği
5. Genel sağlık önerileri

Yanıtını Türkçe olarak ver.`;

            const response = await this.model.invoke(prompt);
            return response;
        } catch (error) {
            console.error('Reçete önerisi oluşturma hatası:', error);
            throw new Error('Reçete önerileri oluşturulurken bir hata oluştu');
        }
    }
}

module.exports = PrescriptionHandler; 