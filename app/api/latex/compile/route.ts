import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { latexCode } = await req.json();

        if (!latexCode) {
            return NextResponse.json({ success: false, error: 'No LaTeX code provided' }, { status: 400 });
        }

        // Using texlive.net which is often more reliable
        // texlive.net requires multipart/form-data
        const params = new FormData();
        params.append('filecontents[]', latexCode);
        params.append('filename[]', 'document.tex');
        params.append('engine', 'pdflatex');
        params.append('return', 'pdf');

        const res = await fetch('https://texlive.net/cgi-bin/latexcgi', {
            method: 'POST',
            body: params,
        });

        if (!res.ok) {
            const errorText = await res.text();
            return NextResponse.json({
                success: false,
                error: 'Compilation failed',
                log: errorText
            }, { status: 500 });
        }

        // Texlive.net might return HTML if there's an error, let's verify Content-Type
        const contentType = res.headers.get('content-type');
        if (contentType && !contentType.includes('application/pdf')) {
            const errorHtml = await res.text();
            // Try to extract the verbatim log if it's an HTML error page
            const logMatch = errorHtml.match(/<pre>([\s\S]*?)<\/pre>/i);
            const log = logMatch ? logMatch[1] : errorHtml;

            return NextResponse.json({
                success: false,
                error: 'Compilation failed with LaTeX errors',
                log: log.replace(/<[^>]*>?/gm, '') // Strip HTML tags
            }, { status: 400 });
        }

        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString('base64');

        return NextResponse.json({
            success: true,
            pdfBase64: base64
        });

    } catch (error: any) {
        console.error('Compilation error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
