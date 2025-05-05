import { useState, useEffect } from "react";

export const DisplayTokenUri = ({
  tokenUri,
  symbol,
  className = "",
}: {
  tokenUri: string;
  symbol: string;
  className?: string;
}) => {
  // Using imageLoaded in onLoad handler at line 156
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [actualImageUrl, setActualImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Get a background color based on symbol initials
  const getColorForSymbol = (symbol: string) => {
    const initials = (symbol || 'XX').slice(0, 2).toUpperCase();
    const colorMap: Record<string, string> = {
      'BT': 'bg-orange-500',
      'ET': 'bg-blue-500',
      'US': 'bg-green-500',
      'XR': 'bg-purple-500'
    };
    return colorMap[initials] || 'bg-red-500';
  };
  
  const bgColor = getColorForSymbol(symbol);
  
  // Use direct fetch approach like in SwapTile, which works reliably
  useEffect(() => {
    const fetchMetadata = async () => {
      console.log(`DisplayTokenUri for ${symbol}: Starting fetch for tokenUri:`, tokenUri);
      
      if (!tokenUri || tokenUri === "N/A") {
        console.log(`DisplayTokenUri for ${symbol}: Invalid token URI, skipping fetch`);
        return;
      }
      
      setIsLoading(true);
      
      // Skip for data URIs (if any)
      if (tokenUri.startsWith('data:')) {
        console.log(`DisplayTokenUri for ${symbol}: Using data URI directly`);
        setActualImageUrl(tokenUri);
        setIsLoading(false);
        return;
      }
      
      try {
        // Handle IPFS URIs - use the same gateway as SwapTile
        let uri;
        if (tokenUri.startsWith('ipfs://')) {
          uri = `https://content.wrappr.wtf/ipfs/${tokenUri.slice(7)}`;
          console.log(`DisplayTokenUri for ${symbol}: Converting IPFS URI to`, uri);
        } else {
          uri = tokenUri;
          console.log(`DisplayTokenUri for ${symbol}: Using http URI directly:`, uri);
        }
        
        console.log(`DisplayTokenUri for ${symbol}: Fetching metadata from: ${uri}`);
        
        // Try to fetch as JSON
        const response = await fetch(uri);
        
        if (!response.ok) {
          console.error(`DisplayTokenUri for ${symbol}: Fetch failed with status:`, response.status);
          throw new Error(`Failed to fetch metadata: ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type');
        console.log(`DisplayTokenUri for ${symbol}: Content-Type:`, contentType);
        
        // If it's JSON, try to extract image URL
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          console.log(`DisplayTokenUri for ${symbol}: Got metadata:`, data);
          
          if (data && data.image) {
            // Handle IPFS image URL
            let imageUrl;
            if (data.image.startsWith('ipfs://')) {
              imageUrl = `https://content.wrappr.wtf/ipfs/${data.image.slice(7)}`;
              console.log(`DisplayTokenUri for ${symbol}: Converting image IPFS URI to:`, imageUrl);
            } else {
              imageUrl = data.image;
              console.log(`DisplayTokenUri for ${symbol}: Using image URL directly:`, imageUrl);
            }
            
            console.log(`DisplayTokenUri for ${symbol}: Setting image URL:`, imageUrl);
            setActualImageUrl(imageUrl);
          } else {
            console.error(`DisplayTokenUri for ${symbol}: No image field in metadata:`, data);
            throw new Error('No image in metadata');
          }
        } else {
          // If not JSON, use URI directly as image
          console.log(`DisplayTokenUri for ${symbol}: Not JSON, using URI directly as image:`, uri);
          setActualImageUrl(uri);
        }
      } catch (err) {
        console.error(`DisplayTokenUri for ${symbol}: Error fetching metadata:`, err);
        setImageError(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMetadata();
  }, [tokenUri, symbol]);
  
  // Fallback for invalid token URIs
  if (!tokenUri || tokenUri === "N/A") {
    return (
      <div className={`w-full h-full flex ${bgColor} text-white justify-center items-center rounded-full ${className}`}>
        {symbol?.slice(0, 3)}
      </div>
    );
  }
  
  // Loading state
  if (isLoading) {
    return (
      <div className={`w-full h-full flex bg-gray-200 text-gray-700 justify-center items-center rounded-full animate-pulse ${className}`}>
        {symbol?.slice(0, 3)}
      </div>
    );
  }
  
  // Error or no image available
  if (imageError || !actualImageUrl) {
    return (
      <div className={`w-full h-full flex ${bgColor} text-white justify-center items-center rounded-full ${className}`}>
        {symbol?.slice(0, 3)}
      </div>
    );
  }
  
  // Successfully loaded image
  return (
    <div className="relative w-full h-full rounded-full overflow-hidden">
      {/* Fallback that's visible until image loads */}
      <div className={`absolute inset-0 flex ${bgColor} text-white justify-center items-center`}>
        {symbol?.slice(0, 3)}
      </div>
      
      {/* The actual image - with more logging for debugging */}
      <img
        src={actualImageUrl}
        alt={`${symbol} logo`}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ zIndex: 1 }}
        onLoad={() => {
          console.log(`DisplayTokenUri for ${symbol}: Image loaded successfully:`, actualImageUrl);
          setImageLoaded(true);
        }}
        onError={(e) => {
          console.error(`DisplayTokenUri for ${symbol}: Image load error for URL:`, actualImageUrl, e);
          setImageError(true);
        }}
        loading="eager" // Force eager loading instead of lazy
      />
    </div>
  );
};
