import natural from 'natural';
import compromise from 'compromise';

class NLPProcessor {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmer;
    this.tfidf = new natural.TfIdf();

    this.stopWords = new Set([
      'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
      'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
      'to', 'was', 'will', 'with', 'i', 'me', 'my', 'myself', 'we',
    ]);

    this.intentPatterns = {
      search: ['find', 'search', 'look', 'show', 'get'],
      filter: ['filter', 'only', 'just', 'exclude'],
      sort: ['sort', 'order', 'arrange', 'organize'],
      compare: ['compare', 'versus', 'vs', 'difference'],
      price: ['cheap', 'expensive', 'price', 'cost', 'affordable', 'budget'],
      quality: ['best', 'top', 'quality', 'premium', 'highest rated'],
    };
  }

  processQuery(query) {
    const tokens = this.tokenize(query);
    const filteredTokens = this.removeStopWords(tokens);
    const stemmedTokens = this.stemTokens(filteredTokens);
    const intent = this.detectIntent(query);
    const entities = this.extractEntities(query);
    const keywords = this.extractKeywords(query);

    return {
      original: query,
      tokens: filteredTokens,
      stemmed: stemmedTokens,
      intent,
      entities,
      keywords,
      cleaned: filteredTokens.join(' '),
    };
  }

  tokenize(text) {
    return this.tokenizer.tokenize(text.toLowerCase());
  }

  removeStopWords(tokens) {
    return tokens.filter(token => !this.stopWords.has(token));
  }

  stemTokens(tokens) {
    return tokens.map(token => this.stemmer.stem(token));
  }

  detectIntent(query) {
    const lowerQuery = query.toLowerCase();
    const intents = [];

    Object.entries(this.intentPatterns).forEach(([intent, patterns]) => {
      if (patterns.some(pattern => lowerQuery.includes(pattern))) {
        intents.push(intent);
      }
    });

    return intents.length > 0 ? intents : ['search'];
  }

  extractEntities(text) {
    const doc = compromise(text);

    return {
      brands: this.extractBrands(text),
      numbers: doc.numbers().out('array'),
      dates: doc.dates().out('array'),
      places: doc.places().out('array'),
      money: doc.money().out('array'),
    };
  }

  extractBrands(text) {
    const knownBrands = [
      'apple', 'samsung', 'google', 'microsoft', 'sony', 'lg', 'dell',
      'hp', 'lenovo', 'asus', 'acer', 'nike', 'adidas', 'puma',
    ];

    const words = text.toLowerCase().split(/\s+/);
    return words.filter(word => knownBrands.includes(word));
  }

  extractKeywords(text, topN = 5) {
    this.tfidf.addDocument(text);
    const keywords = [];

    this.tfidf.listTerms(0).slice(0, topN).forEach(item => {
      keywords.push({
        term: item.term,
        tfidf: item.tfidf,
      });
    });

    return keywords;
  }

  expandQuery(query) {
    const synonymMap = {
      phone: ['mobile', 'smartphone', 'cell phone'],
      laptop: ['notebook', 'computer', 'pc'],
      cheap: ['affordable', 'budget', 'inexpensive', 'low cost'],
      expensive: ['premium', 'costly', 'high end'],
      good: ['great', 'excellent', 'best', 'top'],
    };

    const words = query.toLowerCase().split(/\s+/);
    const expanded = [...words];

    words.forEach(word => {
      if (synonymMap[word]) {
        expanded.push(...synonymMap[word]);
      }
    });

    return [...new Set(expanded)];
  }

  correctSpelling(word) {
    const dictionary = [
      'phone', 'laptop', 'tablet', 'computer', 'keyboard', 'mouse',
      'monitor', 'camera', 'headphone', 'speaker', 'charger',
    ];

    let minDistance = Infinity;
    let correction = word;

    dictionary.forEach(dictWord => {
      const distance = natural.LevenshteinDistance(word.toLowerCase(), dictWord);
      if (distance < minDistance && distance <= 2) {
        minDistance = distance;
        correction = dictWord;
      }
    });

    return correction;
  }

  extractPriceRange(query) {
    const pricePatterns = [
      /under\s+\$?(\d+)/i,
      /below\s+\$?(\d+)/i,
      /less\s+than\s+\$?(\d+)/i,
      /above\s+\$?(\d+)/i,
      /over\s+\$?(\d+)/i,
      /more\s+than\s+\$?(\d+)/i,
      /between\s+\$?(\d+)\s+and\s+\$?(\d+)/i,
      /\$(\d+)\s*-\s*\$?(\d+)/,
    ];

    for (const pattern of pricePatterns) {
      const match = query.match(pattern);
      if (match) {
        if (match[2]) {
          return { min: parseInt(match[1]), max: parseInt(match[2]) };
        } else if (query.includes('under') || query.includes('below') || query.includes('less')) {
          return { max: parseInt(match[1]) };
        } else {
          return { min: parseInt(match[1]) };
        }
      }
    }

    return null;
  }

  analyzeSentiment(text) {
    const analyzer = new natural.SentimentAnalyzer('English', this.stemmer, 'afinn');
    const tokens = this.tokenizer.tokenize(text);
    const score = analyzer.getSentiment(tokens);

    return {
      score,
      sentiment: score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral',
    };
  }

  generateSuggestions(query, context = []) {
    const processed = this.processQuery(query);
    const suggestions = [];

    processed.tokens.forEach(token => {
      const corrected = this.correctSpelling(token);
      if (corrected !== token) {
        suggestions.push(query.replace(token, corrected));
      }
    });

    const expanded = this.expandQuery(query);
    if (expanded.length > processed.tokens.length) {
      suggestions.push(expanded.slice(0, 5).join(' '));
    }

    context.forEach(item => {
      if (item.toLowerCase().includes(query.toLowerCase())) {
        suggestions.push(item);
      }
    });

    return [...new Set(suggestions)].slice(0, 5);
  }
}

export default new NLPProcessor();
