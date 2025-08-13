import mongoose, {Document,Schema, Model} from "mongoose";
import { IUser } from "./user.model";

interface IComment extends Document {
    user: IUser;
    question: string;
    questionReplies: IReview[];
}

interface IReview extends Document {
    user: IUser;
    rating: number;
    comment: string;
    commentReplies?: IComment[];
}

interface ILink extends Document {
    title: string;
    url: string;
}
interface ICourseData extends Document {
    title: string;
    description: string;
    videoURL: string;
    videoThumbnail: object;
    videoSection: string;
    videoLength: number;
    videoPlayer: string;
    links: ILink[];
    suggestions: string;
    questions: IComment[];
}

interface ICourse extends Document {
    name: string;
    description?: string;
    price: number;
    estimatedPrice?: number;
    thumbnail: object;
    tags: string;
    level: string;
    demoURL: string;
    benefits: [
        {
            title: string;
        }
    ];
    prerequisites: [
        {   title: string; }
    ];
    reviews: IReview[];
    courseData: ICourseData[];
    ratings?: number;
    purchased?: number;
}
const reviewsSchema = new Schema<IReview>({
    user: Object,
    rating: { 
        type: Number,
        default: 0
    },
    comment: String,
    commentReplies: [Object]
});

const linksSchema = new Schema<ILink>({
    title: String,
    url: String,
});

const commentSchema = new Schema<IComment>({
    user: Object,
    question: String,
    questionReplies: [Object],
});

const courseDataSchema = new Schema<ICourseData>({
    title: String,
    description: String,
    videoURL: String,
    videoSection: String,
    videoLength: Number,
    videoPlayer: String,
    links: [linksSchema],
    suggestions: String,
    questions: [commentSchema],
});

const courseSchema = new Schema<ICourse>({
    name: {
        type: String,
        required: true,
    },
    description: { 
        type: String, 
        required: true 
    },
    price: {
        type: Number,
        required: true,
    },
    estimatedPrice: Number,
    thumbnail: {
        public_id: {
            type: String,
        },
        url: {
            type: String,
        }
    },
    tags: {
        type: String,
        required: true
    },
    level: {
        type: String,
        required: true
    },
    demoURL: {
        type: String,
        required: true
    },
    benefits: [
        {
            title: {
                type: String,
            },
        },
    ],
    prerequisites: [
        {
            title: String,
        },
    ],
    reviews: [reviewsSchema],
    courseData: [courseDataSchema],
    ratings: {
        type: Number,
        default: 0
    },
    purchased: {
        type: Number,
        default: 0
    }
},{ timestamps: true });

const CourseModel: Model<ICourse> = mongoose.model<ICourse>("Course", courseSchema);
export default CourseModel;