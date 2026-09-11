// AWS CloudFront Lambda@Edge AST Pruner
exports.handler = async (event) => {
  const request = event.Records[0].cf.request;
  const userAgent = request.headers['user-agent'] ? request.headers['user-agent'][0].value : '';
  const isAIBot = /PerplexityBot|GPTBot|ClaudeBot|OAI-SearchBot/i.test(userAgent);
  if (isAIBot) {
    request.headers['x-ast-prune'] = [{ key: 'X-AST-Prune', value: 'sub-14kb' }];
  }
  return request;
};
