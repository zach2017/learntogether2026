// src/App.tsx

import { useState } from 'react';
import {
  Container,
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  Paper,
  Alert,
} from '@mui/material';

// Define the expected structure of the JSON response from the model
interface OllamaResponse {
  emp_researcher_keywords?: string[];
  general_research_keywords?: string[];
}

function App() {
  const [content, setContent] = useState<string>('');
  const [response, setResponse] = useState<OllamaResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    setResponse(null);

    // This prompt guides the model to return the specific JSON structure we want.
    const prompt = `
      Based on the following content, generate a JSON object with two keys: "emp_researcher_keywords" and "general_research_keywords".
      - "emp_researcher_keywords": A list of specific terms an empirical researcher would use.
      - "general_research_keywords": A list of broader research categories.
      
      Content: "${content}"
    `;

    try {
      const apiResponse = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'qwen2:1.5b', // The model you've pulled
          prompt: prompt,
          format: 'json',     // Crucial for getting a JSON string
          stream: false,      // We want the full response at once
        }),
      });

      if (!apiResponse.ok) {
        throw new Error(`API request failed with status ${apiResponse.status}`);
      }

      const data = await apiResponse.json();
      
      // The model's response is a JSON string inside the 'response' property.
      // We need to parse it again to get the actual object.
      if (data.response) {
        setResponse(JSON.parse(data.response));
      }

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Failed to get response from Ollama. Make sure Ollama is running and the model is pulled. Error: ${errorMessage}`);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Ollama Keyword Generator 🔬
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            label="Enter Your Content Here"
            variant="outlined"
            fullWidth
            multiline
            rows={8}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            margin="normal"
            required
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isLoading || !content.trim()}
            sx={{ mt: 2 }}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Generate Keywords'}
          </Button>
        </form>

        {error && (
          <Alert severity="error" sx={{ mt: 3 }}>
            {error}
          </Alert>
        )}

        {response && (
          <Paper elevation={3} sx={{ mt: 4, p: 3, backgroundColor: '#f5f5f5' }}>
            <Typography variant="h6" component="h2" gutterBottom>
              Generated Keywords
            </Typography>
            <Box component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              <code>{JSON.stringify(response, null, 2)}</code>
            </Box>
          </Paper>
        )}
      </Box>
    </Container>
  );
}

export default App;