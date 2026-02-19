Please check the health and validity of the following endpoints for my ERC-8004 agent registered on 8004scan:

https://earnbase.vercel.app/.well-known/agent-card.json i.e public/.well-known/agent-card.json — should return a valid A2A agent card as application/json
https://earnbase.vercel.app/.well-known/mcp.json i.e public/.well-known/mcp.json — should return a valid MCP manifest as application/json


For each endpoint please tell me:

Does it respond with HTTP 200?
What is the Content-Type header returned?
Is the response body valid JSON (for the first two)?
How fast does it respond (latency)?
Are there any missing or malformed fields compared to the A2A and ERC-8004/MCP specs?
Any CORS issues that would block external services like 8004scan from reading them?

Then give me a summary of what needs to be fixed to improve the Service score on 8004scan.