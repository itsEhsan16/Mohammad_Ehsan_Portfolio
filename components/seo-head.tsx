import Head from 'next/head';

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
}

export function SEOHead({
  title = 'Mohammad Ehsan | Portfolio',
  description = 'Software Engineer, Front End & App Developer specializing in React, Next.js, and modern web technologies.',
  image = '/og-image.jpg',
  url = 'https://your-domain.com',
  type = 'website'
}: SEOHeadProps) {
  const fullTitle = title.includes('Mohammad Ehsan') ? title : `${title} | Mohammad Ehsan`;

  return (
    <Head>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="Mohammad Ehsan Portfolio" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
      <meta property="twitter:creator" content="@Md_Ehsan16" />

      {/* Additional Meta Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />
      <meta name="author" content="Mohammad Ehsan" />
      <meta name="theme-color" content="#ff7b00" />

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            "name": "Mohammad Ehsan",
            "jobTitle": "Software Engineer",
            "description": description,
            "url": url,
            "image": image,
            "sameAs": [
              "https://github.com/itsEhsan16",
              "https://www.linkedin.com/in/mohammad-ehsan-23aaba290/",
              "https://x.com/Md_Ehsan16"
            ],
            "knowsAbout": [
              "React",
              "Next.js",
              "TypeScript",
              "JavaScript",
              "Frontend Development",
              "Web Development"
            ]
          })
        }}
      />
    </Head>
  );
}