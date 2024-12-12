
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join, parse } from 'path';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

const BATCH_SIZE = 5; // 設定批次大小

// 輔助函數：將陣列分割成較小的批次
function chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}


export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const files = formData.getAll('files');

        console.log('\n📁 Uploaded...');
        console.log(`🔢 Files: ${files.length}`);

        const uploadDir = join(process.cwd(), 'uploads');
        await mkdir(uploadDir, { recursive: true });

        const batches = chunk(files, BATCH_SIZE);
        const allSavedFiles = [];

        console.log(`\n📦 Seperating to ${batches.length} batch，each batch ${BATCH_SIZE} files`);

        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
            const batch = batches[batchIndex];
            console.log(`\n🔄 Processing ${batchIndex + 1}/${batches.length} batch...`);

            const batchResults = await Promise.all(
                batch.map(async (file: any, fileIndex: number) => {
                    const startTime = Date.now();
                    const currentFileNumber = batchIndex * BATCH_SIZE + fileIndex + 1;

                    console.log(`⏳ [${currentFileNumber}/${files.length}] Processing: ${file.name}`);

                    const bytes = await file.arrayBuffer();
                    const buffer = Buffer.from(bytes);
                    const relativePath = file.name;
                    const filePath = join(uploadDir, relativePath);
                    const { dir, name } = parse(filePath);
                    const txtPath = join(dir, `${name}.txt`);

                    await mkdir(join(uploadDir, relativePath.split('/').slice(0, -1).join('/')), { recursive: true });
                    await writeFile(filePath, buffer);
                    const { text } = await generateText({
                        model: openai('gpt-4o-mini'),
                        messages: [
                            {
                                role: 'user',
                                content: [
                                    {
                                        type: 'text',
                                        text:
                                        `We are aiming to train the best ai image generation model for anime,
                                        please provide precise tags for these images to enhance 
                                        stable diffusion's understanding of the content. 
                                        Employ sufficient keywords or phrases, steering clear of elaborate sentences and extraneous conjunctions. Prioritize the tags by relevance. 
                                        You may use Danbooru style tagging if necessary, and rank the image with tag such as masterpiece, high quality, good quality, low quality to 
                                        determine if its a nice artwork. You may also add aesthetic tag to refine the content categorization.
                                        Such as very aesthetic, aesthetic, pleasing, displeasing to determing if its visually appealing. 
                                        Your tags should be accurate, non-duplicative, and within a 50-120 word count range. The better the tag quality, the better the
                                        training outcome. Tags should be comma-separated. Exceptional tagging will be 
                                        rewarded with $10 per image.`,
                                    },
                                    {
                                        type: 'image',
                                        image: buffer,
                                        experimental_providerMetadata: {
                                            openai: { imageDetail: 'high' },
                                        },
                                    },
                                ],
                            },
                        ],
                    });

                    console.log(text)

                    await writeFile(txtPath, text);

                    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
                    console.log(`✅ [${currentFileNumber}/${files.length}] Finished: ${file.name} (Time: ${processingTime}s)`);

                    return { name: file.name, path: filePath };
                })
            );

            allSavedFiles.push(...batchResults);
            console.log(`\n✨  ${batchIndex + 1} batch processed！`);
        }

        console.log('\n🎉 all batch complete！');
        console.log(`📊 Processed ${files.length} files\n`);

        return NextResponse.json({
            success: true,
            message: '檔案上傳成功',
            files: allSavedFiles
        });

    } catch (error) {
        console.error('\n❌ 上傳處理錯誤:', error);
        return NextResponse.json(
            { success: false, message: '檔案上傳失敗' },
            { status: 500 }
        );
    }
}
