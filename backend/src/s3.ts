import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

// Initialize S3 client
const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

export const uploadToS3 = async (
    file: Express.Multer.File,
    folder: 'uploads' | 'submissions'
): Promise<string> => {
    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    if (!bucketName) {
        throw new Error('AWS_S3_BUCKET_NAME not configured');
    }

    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${folder}/${uuidv4()}.${fileExtension}`;

    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
    });

    try {
        await s3Client.send(command);
        return `https://${bucketName}.s3.amazonaws.com/${fileName}`;
    } catch (error) {
        console.error('Error uploading to S3:', error);
        throw new Error('Failed to upload file to S3');
    }
};

// Generate pre-signed URL for direct upload to S3
export const generatePresignedUrl = async (
    fileName: string,
    contentType: string,
    folder: 'uploads' | 'submissions'
): Promise<{ signedUrl: string; key: string }> => {
    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    if (!bucketName) {
        throw new Error('AWS_S3_BUCKET_NAME not configured');
    }

    const fileExtension = fileName.split('.').pop();
    const key = `${folder}/${uuidv4()}.${fileExtension}`;

    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        ContentType: contentType,
    });

    try {
        const signedUrl = await getSignedUrl(s3Client, command, {
            expiresIn: 3600, // URL expires in 1 hour
        });

        return {
            signedUrl,
            key
        };
    } catch (error) {
        console.error('Error generating pre-signed URL:', error);
        throw new Error('Failed to generate pre-signed URL');
    }
};
