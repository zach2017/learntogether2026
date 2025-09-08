import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: "TBD",
  baseURL: 'https://integrate.api.nvidia.com/v1',
})

async function main() {
  const completion = await openai.chat.completions.create({
    model: "qwen/qwen2.5-coder-32b-instruct",
    messages: [{"role":"user","content":""}],
    temperature: 0.2,
    top_p: 0.7,
    max_tokens: 1024,
    stream: false,
  })
   
  process.stdout.write(completion.choices[0]?.message?.content);
  
}

main();