import * as chai from "chai";
import {expect} from "chai";
import * as fs from "fs-extra";
import * as chaiAsPromised from "chai-as-promised";
import {InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "../src/controller/IInsightFacade";
import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import TestUtil from "./TestUtil";

// This extends chai with assertions that natively support Promises
chai.use(chaiAsPromised);

// This should match the schema given to TestUtil.validate(..) in TestUtil.readTestQueries(..)
// except 'filename' which is injected when the file is read.
export interface ITestQuery {
    title: string;
    query: any;  // make any to allow testing structurally invalid queries
    isQueryValid: boolean;
    result: any;
    filename: string;  // This is injected when reading the file
}

describe("InsightFacade Add/Remove/List Dataset", function () {
    // Reference any datasets you've added to test/data here and they will
    // automatically be loaded in the 'before' hook.
    const datasetsToLoad: { [id: string]: string } = {
        courses: "./test/data/courses.zip",
        invalidMissingBracket: "./test/data/invalidMissingBracket.zip",
        invalidMissingCoursesDirectoryUnderRoot: "./test/data/invalidMissingCoursesDirectoryUnderRoot.zip",
        invalidMissingCourseSectionFields: "./test/data/invalidMissingCourseSectionFields.zip",
        invalidMissingDirectoriesUnderRoot: "./test/data/invalidMissingDirectoriesUnderRoot.zip",
        invalidNoCourseSections: "./test/data/invalidNoCourseSections.zip",
        invalidSectionListWhereObjectExpected: "./test/data/invalidSectionListWhereObjectExpected.zip",
        skipEcon309InvalidJSON: "./test/data/skipEcon309InvalidJSON.zip",
        validSampleOne: "./test/data/validSampleOne.zip",
        invalidWrongFieldTypeForPass: "./test/data/invalidWrongFieldTypeForPass.zip",
        small_courses: "./test/data/small_courses.zip",
        smallcourses: "./test/data/smallcourses.zip",
        evensmallercourses1: "./test/data/evensmallercourses.zip",
        evensmallercourses2: "./test/data/evensmallercourses2.zip",
        smallcoursesfile: "./test/data/smallcoursesfile.txt",
        invalidcourses: "./test/data/invalidcourses.zip",
        invalidcourses2: "./test/data/invalidcourses2.zip",
        partialinvalid: "./test/data/partialinvalid.zip",
        incorrectdirectory: "./test/data/incorrectdirectory.zip",
        smallcoursesfilezip: "./test/data/smallcoursesfilezip.zip",
        invalidsections1: "./test/data/invalidsections1.zip",
        partialinvalidsections: "./test/data/partialinvalidsections.zip",
        validwhitespace: "./test/data/valid\ whitespace.zip",
        datawithwhitespaces: "./test/data/dataset\ with\ white\ spaces.zip",
        rooms: "./test/data/rooms.zip",
        smallrooms: "./test/data/smallrooms.zip",
        invalidrooms: "./test/data/invalidrooms.zip",
        roomsnoindexfile: "./test/data/roomsnoindexfile.zip",
        roomsnomatching: "./test/data/roomsnomatching.zip",
        smallerrooms: "./test/data/smallerrooms.zip",
        roomsindindexbutnotindir: "./test/data/roomsindindexbutnotindir.zip",
        roomspartialinvalid: "./test/data/roomspartialinvalid.zip",
        roomspartialinvalid2: "./test/data/roomspartialinvalid2.zip",
        norooms: "./test/data/norooms.zip",
        roomsindexnobuildings: "./test/data/roomsindexnobuildings.zip",
        roomsindexinvalid: "./test/data/roomsindexinvalid.zip",
        emptysinglebuilding: "./test/data/emptysinglebuilding.zip",
        invalidhtmlelements: "./test/data/invalidhtmlelements.zip"
    };
    let datasets: { [id: string]: string } = {};
    let insightFacade: InsightFacade;
    const cacheDir = __dirname + "/../data";

    before(function () {
        // This section runs once and loads all datasets specified in the datasetsToLoad object
        // into the datasets object
        Log.test(`Before all`);
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir);
        }
        for (const id of Object.keys(datasetsToLoad)) {
            datasets[id] = fs.readFileSync(datasetsToLoad[id]).toString("base64");
        }
        try {
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        }
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });


    afterEach(function () {
        // This section resets the data directory (removing any cached data) and resets the InsightFacade instance
        // This runs after each test, which should make each test independent from the previous one
        Log.test(`AfterTest: ${this.currentTest.title}`);
        try {
            fs.removeSync(cacheDir);
            fs.mkdirSync(cacheDir);
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        }
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });


    it("Should add a valid dataset", function () {
        const id: string = "smallcourses";
        const expected: string[] = [id];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses
        );
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    // add two valid data set and upon second addition check if the return value is an array containing two names
    it("Should add two valid datasets with the same identifier", function () {
        const id: string = "smallcourses";
        const expected: any = InsightError;
        const futureResult: Promise<string[]> = insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then(() => {
                return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
            });
        return expect(futureResult).to.be.rejectedWith(expected);
    });

    it("Attempt to add an empty string as a dataset - invalid dataset", function () {
        const id: string = "courses";
        const dataset: string = "";
        const expected: any = InsightError;
        const futureResult: Promise<string[]> = insightFacade.addDataset(id, dataset, InsightDatasetKind.Courses);
        return expect(futureResult).to.be.rejectedWith(expected);
    });

    it("Attempt to add dataset of invalid type InsightDatasetKind.Rooms", function () {
        const id: string = "courses";
        const expected: any = InsightError;
        const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms);
        return expect(futureResult).to.be.rejectedWith(expected);
    });

    it("Attempt to add a valid dataset with an invalid course file", function () {
        const id: string = "skipEcon309InvalidJSON";
        const expected: string[] = ["skipEcon309InvalidJSON"];
        const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    it("Should add valid dataset with invalid white space id", function () {
        const id: string = " ";
        const expected: any = InsightError;
        const futureResult: Promise<string[]> = insightFacade
            .addDataset(id, datasets["courses"], InsightDatasetKind.Courses);
        return expect(futureResult).to.be.rejectedWith(expected);
    });

    it("Attempt to add a valid dataset with an invalid name containing an underscore", function () {
        const id: string = "_";
        const expected: any = InsightError;
        const futureResult: Promise<string[]> = insightFacade
            .addDataset(id, datasets["courses"], InsightDatasetKind.Courses);
        return expect(futureResult).to.be.rejectedWith(expected);
    });

    it("Attempt to add invalid dataset with no \"courses\" directory under root", function () {
        const id: string = "invalidMissingCoursesDirectoryUnderRoot";
        const expected: any = InsightError;
        const futureResult: Promise<string[]> = insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses);
        return expect(futureResult).to.be.rejectedWith(expected);
    });

    it("Attempt to add invalid dataset with no course sections", function () {
        const id: string = "invalidNoCourseSections";
        const expected: any = InsightError;
        const futureResult: Promise<string[]> = insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses);
        return expect(futureResult).to.be.rejectedWith(expected);
    });

    it("Attempt to add invalid dataset with course serialization missing a bracket", function () {
        const id: string = "invalidMissingBracket";
        const expected: any = InsightError;
        const futureResult: Promise<string[]> = insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses);
        return expect(futureResult).to.be.rejectedWith(expected);
    });

    it("Attempt to add invalid dataset with course sections missing required fields", function () {
        const id: string = "invalidMissingCourseSectionFields";
        const expected: any = InsightError;
        const futureResult: Promise<string[]> = insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses);
        return expect(futureResult).to.be.rejectedWith(expected);
    });

    it("Attempt to add invalid dataset with no directories under root", function () {
        const id: string = "invalidMissingCoursesDirectoryUnderRoot";
        const expected: any = InsightError;
        const futureResult: Promise<string[]> = insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses);
        return expect(futureResult).to.be.rejectedWith(expected);
    });

    it("Attempt to add invalid dataset with course section is an array where an object is expected", function () {
        const id: string = "invalidSectionListWhereObjectExpected";
        const expected: any = InsightError;
        const futureResult: Promise<string[]> = insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses);
        return expect(futureResult).to.be.rejectedWith(expected);
    });

    it("Attempt to remove a dataset that does not exist", function () {
        const id: string = "doesnotexist";
        const expected: any = NotFoundError;
        const futureResult: Promise<string> = insightFacade.removeDataset(id);
        return expect(futureResult).to.be.rejectedWith(expected);
    });

    it("Call removeDataset with ` ` as the identifier (invalid ids are insighterrors)", function () {
        const id: string = " ";
        const expected: any = InsightError;
        const futureResult: Promise<string> = insightFacade.removeDataset(id);
        return expect(futureResult).to.be.rejectedWith(expected);
    });

    it("Call removeDataset with '-' as the identifier (invalid ids are insighterrors)", function () {
        const id: string = "_";
        const expected: any = InsightError;
        const futureResult: Promise<string> = insightFacade.removeDataset(id);
        return expect(futureResult).to.be.rejectedWith(expected);
    });

    it("Call removeDataset with null as the identifier", function () {
        const id: string = null;
        const expected: any = InsightError;
        const futureResult: Promise<string> = insightFacade.removeDataset(id);
        return expect(futureResult).to.be.rejectedWith(expected);
    });

    it("Should add and then remove a valid dataset", function () {
        const id: string = "smallcourses";
        const expected: string = "smallcourses";
        const futureResult: Promise<string> = insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then(() => {
               return insightFacade.removeDataset(id);
            }
        );
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    it("Should add one dataset and call list datasets function", function () {
        const id: string = "validSampleOne";
        const expected: InsightDataset[] = [{
            id: "validSampleOne",
            kind: InsightDatasetKind.Courses,
            numRows: 4
        }];
        const futureResult: Promise<InsightDataset[]> = insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then(() => {
                return insightFacade.listDatasets();
            });
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    it("Should call listDatasets when zero datasets have been added", function () {
        const futureResult = insightFacade.listDatasets();
        const expected: InsightDataset[] = [];
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    it("Should call listDatasets after adding a dataset and then again after removing a dataset", function () {
        const id: string = "validSampleOne";
        let expected: InsightDataset[] = [{
            id: "validSampleOne",
            kind: InsightDatasetKind.Courses,
            numRows: 4
        }];
        let futureResult: Promise<InsightDataset[]> = insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then(() => {
                return insightFacade.listDatasets();
            });
        return expect(futureResult).to.eventually.deep.equal(expected)
            .then(() => {
                expected = [];
                futureResult = insightFacade
                    .removeDataset(id)
                    .then(() => {
                        return insightFacade.listDatasets();
                    });
                return expect(futureResult).to.eventually.deep.equal(expected);
            });
    });

    it("Attempt to add invalid dataset with wrong field type for field pass", function () {
        const id: string = "invalidWrongFieldTypeForPass";
        const expected: any = InsightError;
        const futureResult: Promise<string[]> = insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        return expect(futureResult).to.be.rejectedWith(expected);
    });

    it("Attempt to add and remove a dataset with name with white spaces", function () {
        const id: string = "dataset with white spaces";
        let expected: any = [id];
        let futureResult: any = insightFacade
            .addDataset(id, datasets["datawithwhitespaces"], InsightDatasetKind.Courses);
        return expect(futureResult).to.eventually.deep.equal(expected)
            .then(() => {
                expected = id;
                futureResult = insightFacade.removeDataset(id);
                return expect(futureResult).to.eventually.deep.equal(expected);
            });
    });
    it("Pass: should remove a valid dataset, basic", function () {
        const id: string = "smallcourses";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then(() => {
                const returnID: Promise<string> = insightFacade.removeDataset(id);
                return expect(returnID).to.eventually.deep.equal(id);
            })
            .catch((err: any) => {
                return expect.fail("Shouldn't fail");
            });
    });
    it("Pass: Try to add two different datasets", function () {
        const dataset: string = "smallcourses";
        const identifierOne: string = "one";
        const identifierTwo: string = "two";
        return insightFacade.addDataset(identifierOne, datasets[dataset], InsightDatasetKind.Courses)
            .then(() => {
                return insightFacade.addDataset(identifierTwo, datasets[dataset], InsightDatasetKind.Courses);
            })
            .then((res: string[]) => {
                return expect(res).to.have.members([identifierOne, identifierTwo]);
            });
    });
    it("Pass: Try to add two SAME datasets with removing before", function () {
        const id1: string = "smallcourses";
        return insightFacade.addDataset(id1, datasets[id1], InsightDatasetKind.Courses)
            .then(() => {
                return insightFacade.removeDataset(id1);
            })
            .then(() => {
                return insightFacade.addDataset(id1, datasets[id1], InsightDatasetKind.Courses);
            })
            .then((res: string[]) => {
                return expect(res).to.deep.equal([id1]);
            });
    });
    it("Pass: Try to add a file with partially valid courses", function () {
        const id: string = "partialinvalid";
        const expected: string[] = [id];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.eventually.deep.equal(expected);
    });
    it("Pass: Try to add a file with partially valid course sections", function () {
        const id: string = "partialinvalidsections";
        const expected: string[] = [id];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.eventually.deep.equal(expected);
    });
    it("Pass: Try to add a file that includes whitespace", function () {
        const id: string = "validwhitespace";
        const expected: string[] = [id];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.eventually.deep.equal(expected);
    });
    // -------------
    // Failing Tests:
    // -------------
    // Add:
    it("Fail: Try to add a non-existing dataset with a valid name", function () {
        const id: string = "courses-2";
        const fail: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(fail).to.be.rejectedWith(InsightError);
    });

    it("Fail: Try to add an incorrect file type", function () {
        const id: string = "smallcoursesfile";
        const fail: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(fail).to.be.rejectedWith(InsightError);
    });
    it("Fail: Try to add a zip with invalid courses", function () {
        const id: string = "invalidcourses";
        const fail: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(fail).to.be.rejectedWith(InsightError);
    });
    it("Fail: Try to add a zip with invalid courses, txt files", function () {
        const id: string = "invalidcourses2";
        const fail: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(fail).to.be.rejectedWith(InsightError);
    });
    it("Fail: Try to add a zip with incorrect directory, no courses", function () {
        const id: string = "incorrectdirectory";
        const fail: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(fail).to.be.rejectedWith(InsightError);
    });
    it("Fail: Try to add a zip with no directory", function () {
        const id: string = "smallcoursesfilezip";
        const fail: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(fail).to.be.rejectedWith(InsightError);
    });
    it("Fail: Try to remove a valid dataset which is not added", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        const returnID: Promise<string> = insightFacade.removeDataset(id);
        return expect(returnID).to.be.rejectedWith(NotFoundError);
    });
    it("Fail: Try to add a course with invalid sections then remove it", function () {
        const id: string = "invalidsections1";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then(() => {
                return expect.fail("Shouldn't add the course");
            })
            .catch((err) => {
                const ret: Promise<string> = insightFacade.removeDataset(id);
                return expect(ret).to.be.rejectedWith(NotFoundError);
            });
    });
    it("Fail: Try to remove an incorrect file type, txt", function () {
        const id: string = "smallcoursesfile";
        const fail: Promise<string> = insightFacade.removeDataset(id);
        // NotFoundError bc remove doesn't know it's not a zipfile
        return expect(fail).to.be.rejectedWith(NotFoundError);
    });
    // Invalid ids:
    // Add:
    it("Fail: Try to add an existing dataset with an invalid id", function () {
        const id: string = "small_courses";
        const fail: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(fail).to.be.rejectedWith(InsightError);
    });
    it("Fail: Try to add an invalid id", function () {
        const id: string = "        ";
        const fail: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(fail).to.be.rejectedWith(InsightError);
    });
    // Remove:
    it("Fail: Try to remove an invalid dataset: underscore", function () {
        const id: string = "small_courses";
        const expected: string[] = [id];
        const returnID: Promise<string> = insightFacade.removeDataset(id);
        return expect(returnID).to.be.rejectedWith(InsightError);
    });

    it("Fail: Try to remove an invalid dataset: whitespace", function () {
        const id: string = "   ";
        const returnID: Promise<string> = insightFacade.removeDataset(id);
        return expect(returnID).to.be.rejectedWith(InsightError);
    });

    it("Empty list", function () {
        const expected: InsightDataset[] = [];
        const futureResult: Promise<InsightDataset[]> = insightFacade.listDatasets();
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    it("Single element, after a successful add", function () {
        const id: string = "evensmallercourses2";
        const elem: InsightDataset = {
            id: "evensmallercourses2",
            kind: InsightDatasetKind.Courses,
            numRows: 14
        };
        const expected: InsightDataset[] = [elem];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then(() => {
                const futureResult: Promise<InsightDataset[]> = insightFacade.listDatasets();
                return expect(futureResult).to.eventually.deep.equal(expected);
            })
            .catch((err: any) => {
                return expect.fail("Shouldn't fail");
            });
    });
    it("Two elements, after two successful adds", function () {
        const id: string = "evensmallercourses1";
        const elem: InsightDataset = {
            id: "evensmallercourses1",
            kind: InsightDatasetKind.Courses,
            numRows: 8
        };
        const id2: string = "evensmallercourses2";
        const elem2: InsightDataset = {
            id: "evensmallercourses2",
            kind: InsightDatasetKind.Courses,
            numRows: 14
        };
        const expected: InsightDataset[] = [elem, elem2];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then(() => {
                return insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses);
            })
            .then(() => {
                const futureResult: Promise<InsightDataset[]> = insightFacade.listDatasets();
                return expect(futureResult).to.eventually.deep.equal(expected);
            })
            .catch((err: any) => {
                return expect.fail("Shouldn't fail");
            });
    });
    it("Empty after a remove", function () {
        const id: string = "evensmallercourses2";
        const elem: InsightDataset = {
            id: "evensmallercourses2",
            kind: InsightDatasetKind.Courses,
            numRows: 14
        };
        const expected: InsightDataset[] = [];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then(() => {
                return insightFacade.removeDataset(id);
            })
            .then(() => {
                const futureResult: Promise<InsightDataset[]> = insightFacade.listDatasets();
                return expect(futureResult).to.eventually.deep.equal(expected);
            })
            .catch((err: any) => {
                return expect.fail("Shouldn't fail");
            });
    });

    // List Dataset unit tests
    // Empty dataset if no dataset is included test
    it("Should write empty dataset", function () {
        const futureResult: Promise<InsightDataset[]> = insightFacade.listDatasets();
        return expect(futureResult).to.eventually.deep.equal([]);
    });

    // Single dataset is listed from courses
    // numRows = 64612, from Piazza @171
    it("Should list a single dataset", function () {
        const id: string = "smallcourses";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then(() => {
            return insightFacade.listDatasets().then((returnValue) => {
                return expect(returnValue).to.deep.include.members(
                    [{id: id, kind: InsightDatasetKind.Courses, numRows: 22, }]
                );
            });
        });
    });

    // Dataset already exists
    it("Should not add existing dataset", function () {
        const id: string = "smallcourses";
        return insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses)
            .then(() => {
                return insightFacade.addDataset(
                id,
                datasets[id],
                InsightDatasetKind.Courses)
                .catch((error) => {
                    return expect(error).to.be.an.instanceOf(InsightError);
                });
            });
    });


    // Dataset is not a valid zip file
    it("Shouldn't add non-zip file", function () {
        const id: string = "coursesNonZip";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Shouldn't add the zip file without 'rooms'", function () {
        const id: string = "smallcourses";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Rooms,
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    it("Shouldn't add non-zip file: rooms", function () {
        const id: string = "coursesNonZip";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Rooms,
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });


    // Dataset is empty
    it("Shouldn't add empty dataset", function () {
        const id: string = "coursesNoJSON";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    // Dataset has a null first field
    it("Shouldn't add dataset with null field 0", function () {
        const id: string = "courses";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            null,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    // Dataset has a null second field
    it("Shouldn't add dataset with null field 1", function () {
        const id: string = "courses";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            null,
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    // Dataset has a null third field
    it("Shouldn't add dataset with null field 2", function () {
        const id: string = "courses";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            null,
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    // Zip dataset contains something other than a JSON file
    it("Shouldn't add file that isn't JSON", function () {
        const id: string = "coursesWrongFile";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });


    // Dataset has invalid JSON file
    it("Shouldn't add invalid JSON dataset", function () {
        const id: string = "coursesInvalidJSON";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });


    // Dataset name is invalid (NBSP/whitespace name)
    it("Shouldn't add nameless dataset", function () {
        const id: string = "namelessDataset";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    // Dataset name is null
    it("Shouldn't add null dataset", function () {
        const id: string = null;
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    // Dataset is nonexistent
    it("Shouldn't add nonexistent dataset", function () {
        const id: string = "coursesDNE";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    // Dataset name has an underscore in it
    it("Shouldn't add dataset with underscore in name", function () {
        const id: string = "courses_Invalid";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    // Dataset JSON has a blank array
    it("Shouldn't add dataset with blank array", function () {
        const id: string = "coursesBlankArray";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    // Dataset JSON is empty
    it("Shouldn't add dataset with empty JSON file", function () {
        const id: string = "coursesEmptyJSON";
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });


    // Remove Dataset unit tests
    // Removing an added dataset
    it("Should first add and then remove a dataset", function () {
        const id: string = "smallcourses";
        return insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        ).then(() => {
            return insightFacade.removeDataset(id).then((returnValue) => {
                return expect(returnValue).to.be.equal(id);
            });
        });
    });

    // Remove a dataset that is null
    it("Should first add and then remove a dataset: invalid id", function () {
        const id: string = null;
        const futureResult: Promise<string> = insightFacade.removeDataset(id);
        return expect(futureResult).to.be.rejectedWith(InsightError);
    });

    // Remove a dataset that DNE
    it("Should first add and then remove a dataset: DNE", function () {
        const id: string = "DNE";
        const futureResult: Promise<string> = insightFacade.removeDataset(id);
        return expect(futureResult).to.be.rejectedWith(NotFoundError);
    });

    // Add a dataset, then remove it twice
    it("Shouldn't be able to remove a dataset twice", function () {
        const id: string = "smallcourses";
        return insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses, )
            .then(() => {
                return insightFacade.removeDataset(id)
                    .then(() => {
                        return insightFacade.removeDataset(id)
                            .catch((error) => {
                                return expect(error).to.be.an.instanceOf(NotFoundError);
                            });
                    });
            });
    });
    it("Check if the dataset is still in memory after a 'crash' with list", function () {
        const id: string = "smallcourses";
        const expected: string[] = [id];
        return insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses
        )
            .then((_) => {
                let insightFacade2: InsightFacade = new InsightFacade();
                let list = insightFacade2.listDatasets();
                return expect(list).to.eventually.deep.include.members([{
                    id: "smallcourses",
                    kind: InsightDatasetKind.Courses,
                    numRows: 22
                }]);
            })
            .catch((err) => {
                return expect.fail("Should be able to list the datasets in disk after a crash");
            });
    });
    it("Check if the dataset is still removable after a 'crash'", function () {
        const id: string = "smallcourses";
        const expected: string[] = [id];
        return insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses
        )
            .then((_) => {
                let insightFacade2: InsightFacade = new InsightFacade();
                let removedID = insightFacade2.removeDataset(id);
                return expect(removedID).to.eventually.deep.equal(id);
            })
            .catch((err) => {
                return expect.fail("Should be able to remove a dataset in disk after a crash");
            });
    });
    it("Check if the dataset is still in memory after a 'crash' with list with a newly added datatset", function () {
        const id: string = "evensmallercourses1";
        const elem: InsightDataset = {
            id: "evensmallercourses1",
            kind: InsightDatasetKind.Courses,
            numRows: 8
        };
        const id2: string = "evensmallercourses2";
        const elem2: InsightDataset = {
            id: "evensmallercourses2",
            kind: InsightDatasetKind.Courses,
            numRows: 14
        };
        const expected: InsightDataset[] = [elem, elem2];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then(() => {
                let insightFacade2 = new InsightFacade();
                return insightFacade2.addDataset(id2, datasets[id2], InsightDatasetKind.Courses)
                    .then(() => {
                        const futureResult: Promise<InsightDataset[]> = insightFacade2.listDatasets();
                        return expect(futureResult).to.eventually.deep.equal(expected);
                    })
                    .catch((err: any) => {
                        return expect.fail("Shouldn't fail");
                    });
            })
            .catch((err: any) => {
                return expect.fail("Shouldn't fail");
            });
    });
    it("Should add valid rooms and courses", function () {
        let id: string = "smallrooms";
        let expected: string[] = [id];
        return insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Rooms
        )
            .then((ids) => {
               id = "smallcourses";
               expected = ids.concat(id);
               const futureResult: Promise<string[]> = insightFacade.addDataset(
                   id,
                   datasets[id],
                   InsightDatasetKind.Courses
               );
               return expect(futureResult).to.eventually.deep.include.members(expected);
            })
            .catch((err) => {
               return expect.fail(err);
            });
    });
    it("Should add and then remove valid rooms dataset", function () {
        const id: string = "smallrooms";
        const expected: string = "smallrooms";
        const futureResult: Promise<string> = insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Rooms)
            .then(() => {
                    return insightFacade.removeDataset(id);
                }
            );
        return expect(futureResult).to.eventually.deep.equal(expected);
    });
    it("Attempt to add invalid dataset with invalid rooms", function () {
        const id: string = "invalidrooms";
        const expected: any = InsightError;
        const futureResult: Promise<string[]> = insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Rooms);
        return expect(futureResult).to.be.rejectedWith(expected);
    });

    it("Attempt to add invalid rooms: index.htm is invalid but classrooms are valid", function () {
        const id: string = "roomsindexinvalid";
        const expected: any = InsightError;
        const futureResult: Promise<string[]> = insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Rooms);
        return expect(futureResult).to.be.rejectedWith(expected);
    });

    it("Attempt to add invalid rooms: index file, but buildings is empty", function () {
        const id: string = "roomsindexnobuildings";
        const expected: any = InsightError;
        const futureResult: Promise<string[]> = insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Rooms);
        return expect(futureResult).to.be.rejectedWith(expected);
    });

    it("Should add valid small rooms", function () {
        const id: string = "smallrooms";
        const expected: string[] = [id];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Rooms
        );
        return expect(futureResult).to.eventually.deep.equal(expected);
    });
    it("Should add rooms where strings are empty", function () {
        const id: string = "emptysinglebuilding";
        const expected: string[] = [id];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Rooms
        );
        return expect(futureResult).to.eventually.deep.equal(expected);
    });
    it("Should add partially invalid rooms", function () {
        const id: string = "roomspartialinvalid";
        const expected: string[] = [id];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Rooms
        );
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    it("Should add partially invalid rooms 2", function () {
        const id: string = "roomspartialinvalid2";
        const expected: string[] = [id];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Rooms
        );
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    it("Should add valid smaller rooms", function () {
        const id: string = "smallerrooms";
        const expected: string[] = [id];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Rooms
        );
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    it("Should add valid rooms: some files in index does not exist in dir", function () {
        const id: string = "roomsindindexbutnotindir";
        const expected: string[] = [id];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Rooms
        );
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    it("Attempt to add rooms with no index file", function () {
        const id: string = "roomsnoindexfile";
        const expected: any = InsightError;
        const futureResult: Promise<string[]> = insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Rooms);
        return expect(futureResult).to.be.rejectedWith(expected);
    });

    it("Attempt to add rooms with no rooms", function () {
        const id: string = "norooms";
        const expected: any = InsightError;
        const futureResult: Promise<string[]> = insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Rooms);
        return expect(futureResult).to.be.rejectedWith(expected);
    });

    it("Attempt to add rooms with index file content not matching the actual rooms", function () {
        const id: string = "roomsnomatching";
        const expected: any = InsightError;
        const futureResult: Promise<string[]> = insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Rooms);
        return expect(futureResult).to.be.rejectedWith(expected);
    });

    it("Attempt to add rooms with invalid html elements", function () {
        const id: string = "invalidhtmlelements";
        const expected: any = InsightError;
        const futureResult: Promise<string[]> = insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Rooms);
        return expect(futureResult).to.be.rejectedWith(expected);
    });

    it("Should add one rooms dataset and call list datasets function", function () {
        const id: string = "rooms";
        const expected: InsightDataset[] = [{
            id: "rooms",
            kind: InsightDatasetKind.Rooms,
            numRows: 364
        }];
        const futureResult: Promise<InsightDataset[]> = insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Rooms)
            .then(() => {
                return insightFacade.listDatasets();
            });
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    it("Check if the datasets are still in memory after a 'crash' with rooms and courses", function () {
        const id: string = "evensmallercourses1";
        const elem: InsightDataset = {
            id: "evensmallercourses1",
            kind: InsightDatasetKind.Courses,
            numRows: 8
        };
        const id2: string = "smallrooms";
        const elem2: InsightDataset = {
            id: "smallrooms",
            kind: InsightDatasetKind.Rooms,
            numRows: 45
        };
        const expected: InsightDataset[] = [elem, elem2];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then(() => {
                return insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Rooms)
                    .then(() => {
                        let insightFacade2 = new InsightFacade();
                        const futureResult: Promise<InsightDataset[]> = insightFacade2.listDatasets();
                        return expect(futureResult).to.eventually.deep.include.members(expected);
                    })
                    .catch((err: any) => {
                        return expect.fail(err);
                    });
            })
            .catch((err: any) => {
                return expect.fail(err);
            });
    });

    it("Pass: Try to add two SAME datasets with removing before for rooms", function () {
        const id1: string = "smallrooms";
        return insightFacade.addDataset(id1, datasets[id1], InsightDatasetKind.Rooms)
            .then(() => {
                return insightFacade.removeDataset(id1);
            })
            .then(() => {
                return insightFacade.addDataset(id1, datasets[id1], InsightDatasetKind.Rooms);
            })
            .then((res: string[]) => {
                return expect(res).to.deep.equal([id1]);
            });
    });

});

/*
 * This test suite dynamically generates tests from the JSON files in test/queries.
 * You should not need to modify it; instead, add additional files to the queries directory.
 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
 */
describe("InsightFacade PerformQuery", () => {
    const datasetsToQuery: { [id: string]: {path: string, kind: InsightDatasetKind} } = {
        courses: {path: "./test/data/courses.zip", kind: InsightDatasetKind.Courses},
        smallcourses: {path: "./test/data/smallcourses.zip", kind: InsightDatasetKind.Courses},
        rooms: {path: "./test/data/rooms.zip", kind: InsightDatasetKind.Rooms},
    };
    let insightFacade: InsightFacade;
    let testQueries: ITestQuery[] = [];

    // Load all the test queries, and call addDataset on the insightFacade instance for all the datasets
    before(function () {
        Log.test(`Before: ${this.test.parent.title}`);

        // Load the query JSON files under test/queries.
        // Fail if there is a problem reading ANY query.
        try {
            testQueries = TestUtil.readTestQueries();
        } catch (err) {
            expect.fail("", "", `Failed to read one or more test queries. ${err}`);
        }

        // Load the datasets specified in datasetsToQuery and add them to InsightFacade.
        // Will fail* if there is a problem reading ANY dataset.
        const loadDatasetPromises: Array<Promise<string[]>> = [];
        insightFacade = new InsightFacade();
        for (const id of Object.keys(datasetsToQuery)) {
            const ds = datasetsToQuery[id];
            const data = fs.readFileSync(ds.path).toString("base64");
            loadDatasetPromises.push(insightFacade.addDataset(id, data, ds.kind));
        }
        return Promise.all(loadDatasetPromises);
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });


    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    // Dynamically create and run a test for each query in testQueries
    // Creates an extra "test" called "Should run test queries" as a byproduct. Don't worry about it
    it("Should run test queries", function () {
        describe("Dynamic InsightFacade PerformQuery tests", function () {
            for (const test of testQueries) {
                it(`[${test.filename}] ${test.title}`, function () {
                    const futureResult: Promise<any[]> = insightFacade.performQuery(test.query);
                    return TestUtil.verifyQueryResult(futureResult, test);
                });
            }
        });
    });
});

