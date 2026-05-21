const JsonLd = ({
  data,
  id,
}: {
  data: Record<string, unknown>
  id?: string
}) => {
  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data),
      }}
    />
  )
}

export default JsonLd
